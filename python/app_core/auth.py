import json
import os
from functools import wraps
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from flask import jsonify, redirect, request, session, url_for

from .config import BASE_DIR, IS_PROD, OAUTH_SCOPES


def _credentials_config():
    env = os.environ.get("GOOGLE_CREDENTIALS_JSON")
    if env:
        try:
            return json.loads(env.strip())
        except json.JSONDecodeError as exc:
            raise RuntimeError("GOOGLE_CREDENTIALS_JSON no es JSON válido") from exc

    local = BASE_DIR / "credentials.json"
    if local.exists():
        try:
            return json.loads(local.read_text().strip())
        except json.JSONDecodeError as exc:
            raise RuntimeError("credentials.json no es JSON válido") from exc

    raise RuntimeError("No se encontraron credenciales. Define GOOGLE_CREDENTIALS_JSON.")


def get_redirect_uri():
    if os.environ.get("REDIRECT_URI"):
        return os.environ["REDIRECT_URI"].strip()

    vercel = os.environ.get("VERCEL_URL")
    if vercel:
        return f"https://{vercel.strip()}/oauth2callback"

    return "http://localhost:5000/oauth2callback"


def make_flow(redirect_uri, state=None):
    from google_auth_oauthlib.flow import Flow

    config = _credentials_config()
    if "installed" in config:
        web_cfg = {
            "web": {
                **config["installed"],
                "redirect_uris": [redirect_uri],
                "javascript_origins": [],
            }
        }
    else:
        web_cfg = config

    kwargs = dict(scopes=OAUTH_SCOPES, redirect_uri=redirect_uri)
    if state:
        kwargs["state"] = state

    flow = Flow.from_client_config(web_cfg, **kwargs)
    flow.oauth2session.pkce = None
    return flow


def build_auth_redirect_url(auth_url):
    parsed = urlparse(auth_url)
    params = parse_qs(parsed.query, keep_blank_values=True)
    params.pop("code_challenge", None)
    params.pop("code_challenge_method", None)
    return urlunparse(parsed._replace(query=urlencode({k: v[0] for k, v in params.items()})))


def load_token_str():
    token_json = session.get("token_json")
    if token_json:
        return token_json

    local = BASE_DIR / "token.json"
    if local.exists():
        return local.read_text()

    return None


def save_token(creds):
    session["token_json"] = creds.to_json()
    session.permanent = True
    try:
        (BASE_DIR / "token.json").write_text(creds.to_json())
    except Exception:
        pass


def get_google_creds():
    token_str = load_token_str()
    if not token_str:
        return None

    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials

    creds = Credentials.from_authorized_user_info(json.loads(token_str), OAUTH_SCOPES)
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            save_token(creds)
        except Exception:
            return None

    return creds if creds.valid else None


def get_allowed_emails():
    raw = os.environ.get("ALLOWED_EMAILS", "").strip()
    if not raw:
        return None
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def fetch_user_info(creds):
    import urllib.request

    req = urllib.request.Request(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {creds.token}"},
    )
    with urllib.request.urlopen(req, timeout=8) as response:
        return json.loads(response.read())


def get_current_user():
    return session.get("user_info")


def is_connected():
    try:
        return session.get("user_info") is not None
    except Exception:
        return False


def get_admin_emails():
    raw = os.environ.get("ADMIN_EMAILS", "").strip()
    if not raw:
        return set()
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def is_admin_user(user):
    if not user:
        return False

    admins = get_admin_emails()
    if admins:
        return user.get("email", "").lower() in admins

    return not IS_PROD


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not is_connected() or not session.get("user_info"):
            return redirect(url_for("auth"))
        return f(*args, **kwargs)

    return decorated


def api_login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not is_connected() or not session.get("user_info"):
            return jsonify({"success": False, "error": "No autenticado", "auth_url": url_for("auth", _external=True)}), 401
        return f(*args, **kwargs)

    return decorated


def api_admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not is_connected() or not session.get("user_info"):
            return jsonify({"success": False, "error": "No autenticado", "auth_url": url_for("auth", _external=True)}), 401
        if not is_admin_user(get_current_user()):
            return jsonify({"success": False, "error": "Acceso restringido"}), 403
        return f(*args, **kwargs)

    return decorated
