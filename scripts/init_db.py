"""Apply api/_lib/schema.sql to the database at DATABASE_URL.

Usage:
    source venv/bin/activate
    python scripts/init_db.py
"""

import pathlib

from dotenv import load_dotenv

load_dotenv(".env.local")

import psycopg  # noqa: E402  (import after load_dotenv so DATABASE_URL is set)
import os

SCHEMA_PATH = pathlib.Path(__file__).resolve().parent.parent / "api" / "_lib" / "schema.sql"


def main() -> None:
    dsn = os.environ["DATABASE_URL"]
    sql = SCHEMA_PATH.read_text()
    with psycopg.connect(dsn) as conn, conn.cursor() as cur:
        cur.execute(sql)
        conn.commit()
    print(f"Applied {SCHEMA_PATH} to database.")


if __name__ == "__main__":
    main()
