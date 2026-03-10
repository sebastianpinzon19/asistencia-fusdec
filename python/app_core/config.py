import os
import secrets
from datetime import timedelta
from pathlib import Path

# Solo activar transporte inseguro en desarrollo local (no en Vercel)
if not os.environ.get("VERCEL"):
    os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")

SPREADSHEET_ID = "1Jkk4yHJTLGF9LwYrrw5qkLy4PaKi5hJT_eiOnWg7LbE"
SHEET_GID = 1547008662
BASE_DIR = Path(__file__).resolve().parent.parent
DAY_COLS = [f"DIA {i}" for i in range(1, 15)]

# Scopes OAuth2: solo para identificar al usuario (login)
OAUTH_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

# Scopes de la cuenta de servicio: acceso al Sheet
SHEET_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

IS_PROD = bool(os.environ.get("VERCEL")) or os.environ.get("FLASK_ENV") == "production"
APP_DEBUG = os.environ.get("APP_DEBUG", "").strip().lower() in {"1", "true", "yes"}


def configure_flask_app(app):
    app.secret_key = os.environ.get("SECRET_KEY") or secrets.token_urlsafe(48)

    if not os.environ.get("SECRET_KEY"):
        print("WARNING: SECRET_KEY no definido. Se usa una clave efímera; define SECRET_KEY en producción.")

    try:
        session_hours = int(os.environ.get("SESSION_HOURS", "12"))
    except (TypeError, ValueError):
        session_hours = 12

    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=max(1, session_hours))

    if IS_PROD:
        app.config["SESSION_COOKIE_SECURE"] = True
