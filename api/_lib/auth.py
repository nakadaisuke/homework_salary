import os
from functools import wraps
from datetime import datetime, timedelta, timezone

import jwt
from flask import request, jsonify

COOKIE_NAME = "session"
SESSION_DAYS = 30


def _secret() -> str:
    return os.environ["JWT_SECRET"]


def create_session_token() -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "ok": True,
        "iat": now,
        "exp": now + timedelta(days=SESSION_DAYS),
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def verify_session_token(token: str) -> bool:
    try:
        jwt.decode(token, _secret(), algorithms=["HS256"])
        return True
    except jwt.PyJWTError:
        return False


def is_deployed_env() -> bool:
    # VERCEL_ENV is "production" or "preview" when deployed, unset locally.
    return os.environ.get("VERCEL_ENV") in ("production", "preview")


def set_session_cookie(response):
    token = create_session_token()
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        secure=is_deployed_env(),
        samesite="Lax",
        max_age=SESSION_DAYS * 24 * 60 * 60,
        path="/",
    )
    return response


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = request.cookies.get(COOKIE_NAME)
        if not token or not verify_session_token(token):
            return jsonify({"error": "unauthorized"}), 401
        return fn(*args, **kwargs)

    return wrapper
