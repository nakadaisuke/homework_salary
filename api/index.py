import os

from flask import Flask, request, jsonify

from api._lib.db import get_conn
from api._lib.auth import require_auth, set_session_cookie, COOKIE_NAME

app = Flask(__name__)


# ---------------------------------------------------------------------------
# auth
# ---------------------------------------------------------------------------


@app.route("/api/auth", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    if data.get("password") != os.environ.get("APP_PASSWORD"):
        return jsonify({"error": "invalid password"}), 401
    resp = jsonify({"ok": True})
    return set_session_cookie(resp)


@app.route("/api/auth", methods=["DELETE"])
def logout():
    resp = jsonify({"ok": True})
    resp.delete_cookie(COOKIE_NAME, path="/")
    return resp


# ---------------------------------------------------------------------------
# people
# ---------------------------------------------------------------------------


@app.route("/api/people", methods=["GET"])
@require_auth
def list_people():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT p.id, p.name, p.role,
                   COALESCE(SUM(c.salary_yen_snapshot)
                            FILTER (WHERE c.settlement_id IS NULL), 0) AS balance_yen
            FROM people p
            LEFT JOIN completions c ON c.person_id = p.id
            GROUP BY p.id
            ORDER BY p.created_at
            """
        )
        rows = cur.fetchall()
    return jsonify(rows)


@app.route("/api/people", methods=["POST"])
@require_auth
def create_person():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    role = data.get("role")
    if not name or role not in ("father", "mother", "child"):
        return jsonify({"error": "name and a valid role are required"}), 400
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO people (name, role) VALUES (%s, %s) RETURNING id, name, role",
            (name, role),
        )
        person = cur.fetchone()
        conn.commit()
    person["balance_yen"] = 0
    return jsonify(person), 201


@app.route("/api/people/<int:person_id>", methods=["PATCH"])
@require_auth
def update_person(person_id: int):
    data = request.get_json(silent=True) or {}
    fields, values = [], []
    if "name" in data:
        fields.append("name = %s")
        values.append((data.get("name") or "").strip())
    if "role" in data:
        if data["role"] not in ("father", "mother", "child"):
            return jsonify({"error": "invalid role"}), 400
        fields.append("role = %s")
        values.append(data["role"])
    if not fields:
        return jsonify({"error": "no fields to update"}), 400
    values.append(person_id)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"UPDATE people SET {', '.join(fields)} WHERE id = %s RETURNING id, name, role",
            values,
        )
        person = cur.fetchone()
        conn.commit()
    if not person:
        return jsonify({"error": "not found"}), 404
    return jsonify(person)


@app.route("/api/people/<int:person_id>", methods=["DELETE"])
@require_auth
def delete_person(person_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM people WHERE id = %s", (person_id,))
        conn.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# jobs
# ---------------------------------------------------------------------------


@app.route("/api/jobs", methods=["GET"])
@require_auth
def list_jobs():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, title, salary_yen, description, days_of_week, is_active
            FROM jobs
            WHERE is_active
            ORDER BY created_at
            """
        )
        rows = cur.fetchall()
    return jsonify(rows)


@app.route("/api/jobs", methods=["POST"])
@require_auth
def create_job():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    salary_yen = data.get("salary_yen")
    description = data.get("description") or None
    days_of_week = data.get("days_of_week") or []
    if not title or not isinstance(salary_yen, int) or salary_yen < 0:
        return jsonify({"error": "title and a non-negative salary_yen are required"}), 400
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO jobs (title, salary_yen, description, days_of_week)
            VALUES (%s, %s, %s, %s)
            RETURNING id, title, salary_yen, description, days_of_week, is_active
            """,
            (title, salary_yen, description, days_of_week),
        )
        job = cur.fetchone()
        conn.commit()
    return jsonify(job), 201


@app.route("/api/jobs/<int:job_id>", methods=["PATCH"])
@require_auth
def update_job(job_id: int):
    data = request.get_json(silent=True) or {}
    fields, values = [], []
    if "title" in data:
        fields.append("title = %s")
        values.append((data.get("title") or "").strip())
    if "salary_yen" in data:
        fields.append("salary_yen = %s")
        values.append(data["salary_yen"])
    if "description" in data:
        fields.append("description = %s")
        values.append(data.get("description") or None)
    if "days_of_week" in data:
        fields.append("days_of_week = %s")
        values.append(data.get("days_of_week") or [])
    if "is_active" in data:
        fields.append("is_active = %s")
        values.append(bool(data["is_active"]))
    if not fields:
        return jsonify({"error": "no fields to update"}), 400
    fields.append("updated_at = now()")
    values.append(job_id)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE jobs SET {', '.join(fields)} WHERE id = %s
            RETURNING id, title, salary_yen, description, days_of_week, is_active
            """,
            values,
        )
        job = cur.fetchone()
        conn.commit()
    if not job:
        return jsonify({"error": "not found"}), 404
    return jsonify(job)


@app.route("/api/jobs/<int:job_id>", methods=["DELETE"])
@require_auth
def delete_job(job_id: int):
    # Soft delete only: completions reference jobs, and history must stay intact.
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "UPDATE jobs SET is_active = false, updated_at = now() WHERE id = %s",
            (job_id,),
        )
        conn.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# completions
# ---------------------------------------------------------------------------


@app.route("/api/completions", methods=["GET"])
@require_auth
def list_completions():
    person_id = request.args.get("person_id", type=int)
    query = """
        SELECT id, person_id, job_id, job_title_snapshot, salary_yen_snapshot,
               completed_on, settlement_id, created_at
        FROM completions
    """
    params = []
    if person_id is not None:
        query += " WHERE person_id = %s"
        params.append(person_id)
    query += " ORDER BY created_at DESC"
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(query, params)
        rows = cur.fetchall()
    return jsonify(rows)


@app.route("/api/completions", methods=["POST"])
@require_auth
def create_completion():
    data = request.get_json(silent=True) or {}
    person_id = data.get("person_id")
    job_id = data.get("job_id")
    if not isinstance(person_id, int) or not isinstance(job_id, int):
        return jsonify({"error": "person_id and job_id are required"}), 400
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT title, salary_yen FROM jobs WHERE id = %s", (job_id,))
        job = cur.fetchone()
        if not job:
            return jsonify({"error": "job not found"}), 404
        cur.execute(
            """
            INSERT INTO completions (person_id, job_id, job_title_snapshot, salary_yen_snapshot)
            VALUES (%s, %s, %s, %s)
            RETURNING id, person_id, job_id, job_title_snapshot, salary_yen_snapshot,
                      completed_on, settlement_id, created_at
            """,
            (person_id, job_id, job["title"], job["salary_yen"]),
        )
        completion = cur.fetchone()
        conn.commit()
    return jsonify(completion), 201


# ---------------------------------------------------------------------------
# settlements
# ---------------------------------------------------------------------------


@app.route("/api/settlements", methods=["GET"])
@require_auth
def list_settlements():
    person_id = request.args.get("person_id", type=int)
    if person_id is None:
        return jsonify({"error": "person_id is required"}), 400
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, person_id, total_yen, settled_at
            FROM settlements
            WHERE person_id = %s
            ORDER BY settled_at DESC
            """,
            (person_id,),
        )
        rows = cur.fetchall()
    return jsonify(rows)


@app.route("/api/settlements", methods=["POST"])
@require_auth
def create_settlement():
    data = request.get_json(silent=True) or {}
    person_id = data.get("person_id")
    if not isinstance(person_id, int):
        return jsonify({"error": "person_id is required"}), 400
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT COALESCE(SUM(salary_yen_snapshot), 0) AS total
            FROM completions
            WHERE person_id = %s AND settlement_id IS NULL
            """,
            (person_id,),
        )
        total = cur.fetchone()["total"]
        if total <= 0:
            return jsonify({"error": "no unpaid balance to settle"}), 400
        cur.execute(
            "INSERT INTO settlements (person_id, total_yen) VALUES (%s, %s) RETURNING id, person_id, total_yen, settled_at",
            (person_id, total),
        )
        settlement = cur.fetchone()
        cur.execute(
            "UPDATE completions SET settlement_id = %s WHERE person_id = %s AND settlement_id IS NULL",
            (settlement["id"], person_id),
        )
        conn.commit()
    return jsonify(settlement), 201
