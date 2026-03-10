import os
import socket
import traceback
from datetime import datetime

from flask import jsonify, redirect, render_template, request, session, url_for

from .auth import (
    api_admin_required,
    api_login_required,
    build_auth_redirect_url,
    fetch_user_info,
    get_allowed_emails,
    get_current_user,
    get_redirect_uri,
    is_connected,
    login_required,
    make_flow,
    save_token,
)
from .config import APP_DEBUG, DAY_COLS, SHEET_GID, SPREADSHEET_ID
from .demo import DEMO_HEADERS, DEMO_STUDENTS
from .sheets import (
    detect_active_day,
    get_all_data,
    get_brigadas,
    get_or_create_log_sheet,
    get_service_account_creds,
    get_sheet,
    get_spreadsheet,
    parse_update_item,
)


def error_payload(public_msg, exc=None):
    payload = {"success": False, "error": public_msg}
    if APP_DEBUG and exc is not None:
        payload["detail"] = str(exc)
    return payload


def log_changes(updates, user, students_by_row, brigada=""):
    try:
        ss = get_spreadsheet()
        log_sheet = get_or_create_log_sheet(ss)
        now = datetime.now()
        fecha = now.strftime("%d/%m/%Y")
        hora = now.strftime("%H:%M:%S")
        rows = []
        for update in updates:
            estudiante = students_by_row.get(update.get("row", 0), "?")
            rows.append(
                [
                    fecha,
                    hora,
                    user.get("email", "?"),
                    user.get("name", "?"),
                    brigada,
                    update.get("row", "?"),
                    estudiante,
                    update.get("day", "?"),
                    update.get("value", "?"),
                ]
            )
        if rows:
            log_sheet.append_rows(rows, value_input_option="USER_ENTERED")
    except Exception as exc:
        print("Error guardando log:", exc)


def get_local_ip():
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("8.8.8.8", 80))
        ip = sock.getsockname()[0]
        sock.close()
        return ip
    except Exception:
        return "desconocida"


def register_routes(app):
    @app.route("/auth")
    def auth():
        redirect_uri = get_redirect_uri()
        flow = make_flow(redirect_uri)
        auth_url, state = flow.authorization_url(access_type="offline", prompt="consent")
        session["oauth_state"] = state
        return redirect(build_auth_redirect_url(auth_url))

    @app.route("/oauth2callback")
    def oauth2callback():
        try:
            redirect_uri = get_redirect_uri()
            flow = make_flow(redirect_uri, state=request.args.get("state"))
            auth_response = request.url
            if os.environ.get("VERCEL") and auth_response.startswith("http://"):
                auth_response = "https://" + auth_response[7:]
            flow.fetch_token(authorization_response=auth_response)
            creds = flow.credentials
            save_token(creds)
        except Exception:
            tb = traceback.format_exc()
            print("ERROR en oauth2callback:", tb)
            return "<h2>Error de autenticación</h2><p>No fue posible iniciar sesión.</p><a href='/auth'>Intentar de nuevo</a>", 500

        try:
            info = fetch_user_info(creds)
            email = info.get("email", "").lower()
            allowed = get_allowed_emails()
            if allowed is not None and email not in allowed:
                session.clear()
                return render_template("blocked.html", email=email), 403
            session["user_info"] = {
                "email": email,
                "name": info.get("name") or info.get("given_name") or email,
                "picture": info.get("picture", ""),
            }
        except Exception:
            pass

        return redirect("/")

    @app.route("/logout")
    def logout():
        session.clear()
        try:
            from .config import BASE_DIR
            (BASE_DIR / "token.json").unlink(missing_ok=True)
        except Exception:
            pass
        return redirect("/")

    @app.route("/")
    def index():
        connected = is_connected()
        user = get_current_user()
        if not connected or not user:
            return render_template("login.html")
        return render_template(
            "index.html",
            today=datetime.now().strftime("%A %d de %B, %Y"),
            demo_mode=False,
            user=user,
            connect_error="",
        )

    @app.route("/api/brigadas")
    @api_login_required
    def api_brigadas():
        try:
            brigadas = get_brigadas()
            return jsonify({"success": True, "brigadas": brigadas})
        except Exception as exc:
            return jsonify(error_payload("No se pudo cargar brigadas", exc)), 500

    @app.route("/api/students")
    def api_students():
        if not is_connected() or not session.get("user_info"):
            return jsonify(
                {
                    "success": True,
                    "demo_mode": True,
                    "headers": DEMO_HEADERS,
                    "students": DEMO_STUDENTS,
                    "activeDay": 4,
                    "dayColumns": DAY_COLS,
                    "fetchedAt": datetime.now().isoformat(),
                    "warning": "Modo demo - ve a /auth para conectar con Google",
                }
            )

        brigada = request.args.get("brigada", "").strip()
        try:
            headers, students = get_all_data(brigada or None)
            return jsonify(
                {
                    "success": True,
                    "demo_mode": False,
                    "headers": headers,
                    "students": students,
                    "activeDay": detect_active_day(students),
                    "dayColumns": DAY_COLS,
                    "brigada": brigada,
                    "fetchedAt": datetime.now().isoformat(),
                }
            )
        except Exception as exc:
            tb = traceback.format_exc()
            print("ERROR en /api/students:", tb)
            return jsonify(error_payload("No se pudo cargar estudiantes", exc)), 500

    @app.route("/api/attendance/bulk", methods=["POST"])
    @api_login_required
    def api_attendance_bulk():
        data = request.get_json() or {}
        updates = data.get("updates", [])
        brigada = data.get("brigada", "").strip()

        if not isinstance(updates, list):
            return jsonify({"success": False, "error": "Formato de updates inválido"}), 400
        if len(updates) > 2000:
            return jsonify({"success": False, "error": "Demasiados cambios en una sola solicitud"}), 400
        if not updates:
            return jsonify({"success": True, "updated": 0})

        try:
            import gspread

            safe_updates = [parse_update_item(update) for update in updates]
            sheet = get_sheet(brigada or None, allow_fallback=(brigada == ""))
            headers = [h.strip() for h in sheet.row_values(1)]
            all_values = sheet.get_all_values()
            name_col = next((i for i, h in enumerate(headers) if "NOMBRE" in h.upper()), 1)
            students_by_row = {i + 2: row[name_col] for i, row in enumerate(all_values[1:]) if row}

            cells, errors = [], []
            for update in safe_updates:
                try:
                    col = headers.index(update["day"].strip()) + 1
                    cells.append(gspread.Cell(update["row"], col, update["value"]))
                except ValueError:
                    errors.append("Col no encontrada: " + update.get("day", "?"))

            if cells:
                sheet.update_cells(cells, value_input_option="USER_ENTERED")

            user = get_current_user()
            log_changes(safe_updates, user or {}, students_by_row, brigada)
            return jsonify(
                {
                    "success": True,
                    "updated": len(cells),
                    "errors": errors,
                    "savedAt": datetime.now().isoformat(),
                }
            )
        except ValueError as exc:
            return jsonify({"success": False, "error": str(exc)}), 400
        except Exception as exc:
            return jsonify(error_payload("No se pudo guardar la asistencia", exc)), 500

    @app.route("/logs")
    @login_required
    def logs_page():
        user = get_current_user()
        try:
            import gspread
            from google.auth.transport.requests import AuthorizedSession

            creds = get_service_account_creds()
            client = gspread.Client(auth=creds)
            client.session = AuthorizedSession(creds)
            ss = client.open_by_key(SPREADSHEET_ID)
            log_sheet = get_or_create_log_sheet(ss)
            rows = log_sheet.get_all_values()
            headers_log = rows[0] if rows else []
            entries = list(reversed(rows[1:])) if len(rows) > 1 else []
        except Exception as exc:
            headers_log, entries = [], []
            print("Error leyendo logs:", exc)

        return render_template("logs.html", user=user, headers=headers_log, entries=entries)

    @app.route("/api/fix/restore_validation")
    @api_admin_required
    def fix_restore_validation():
        try:
            import googleapiclient.discovery

            creds = get_service_account_creds()
            service = googleapiclient.discovery.build("sheets", "v4", credentials=creds)

            meta = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
            sheet_name = None
            for sh in meta.get("sheets", []):
                if sh["properties"]["sheetId"] == SHEET_GID:
                    sheet_name = sh["properties"]["title"]
                    break

            if not sheet_name:
                return jsonify({"error": "Sheet no encontrado"}), 404

            resp = service.spreadsheets().values().get(
                spreadsheetId=SPREADSHEET_ID,
                range=f"'{sheet_name}'!1:1",
            ).execute()
            headers = [h.strip() for h in (resp.get("values") or [[]])[0]]
            requests = []
            for index, header in enumerate(headers):
                if header.startswith("DIA "):
                    requests.append(
                        {
                            "setDataValidation": {
                                "range": {
                                    "sheetId": SHEET_GID,
                                    "startRowIndex": 1,
                                    "endRowIndex": 1000,
                                    "startColumnIndex": index,
                                    "endColumnIndex": index + 1,
                                },
                                "rule": {
                                    "condition": {
                                        "type": "ONE_OF_LIST",
                                        "values": [
                                            {"userEnteredValue": "✓"},
                                            {"userEnteredValue": "×"},
                                            {"userEnteredValue": "E"},
                                        ],
                                    },
                                    "showCustomUi": True,
                                    "strict": False,
                                },
                            }
                        }
                    )

            if requests:
                service.spreadsheets().batchUpdate(spreadsheetId=SPREADSHEET_ID, body={"requests": requests}).execute()

            return jsonify({"success": True, "columnas_restauradas": len(requests)})
        except Exception as exc:
            return jsonify(error_payload("No se pudo restaurar validaciones", exc)), 500

    @app.route("/api/fix/remove_validation")
    @api_admin_required
    def fix_remove_validation():
        try:
            import googleapiclient.discovery

            creds = get_service_account_creds()
            service = googleapiclient.discovery.build("sheets", "v4", credentials=creds)

            meta = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
            sheet_name = None
            for sh in meta.get("sheets", []):
                if sh["properties"]["sheetId"] == SHEET_GID:
                    sheet_name = sh["properties"]["title"]
                    break

            if not sheet_name:
                return jsonify({"error": "Sheet no encontrado"}), 404

            resp = service.spreadsheets().values().get(
                spreadsheetId=SPREADSHEET_ID,
                range=f"'{sheet_name}'!1:1",
            ).execute()
            headers = [h.strip() for h in (resp.get("values") or [[]])[0]]

            requests = []
            for index, header in enumerate(headers):
                if header.startswith("DIA "):
                    requests.append(
                        {
                            "setDataValidation": {
                                "range": {
                                    "sheetId": SHEET_GID,
                                    "startRowIndex": 1,
                                    "endRowIndex": 1000,
                                    "startColumnIndex": index,
                                    "endColumnIndex": index + 1,
                                }
                            }
                        }
                    )

            if requests:
                service.spreadsheets().batchUpdate(spreadsheetId=SPREADSHEET_ID, body={"requests": requests}).execute()

            return jsonify({"success": True, "columnas_liberadas": len(requests)})
        except Exception as exc:
            return jsonify(error_payload("No se pudo eliminar validaciones", exc)), 500

    @app.route("/api/debug/chars")
    @api_admin_required
    def debug_chars():
        try:
            import googleapiclient.discovery

            creds = get_service_account_creds()
            service = googleapiclient.discovery.build("sheets", "v4", credentials=creds)

            result = service.spreadsheets().get(
                spreadsheetId=SPREADSHEET_ID,
                includeGridData=True,
                ranges=["A1:Z3"],
            ).execute()
            sheets = result.get("sheets", [])
            raw_cells = []

            for sh in sheets:
                props = sh.get("properties", {})
                gid = props.get("sheetId")
                if gid != SHEET_GID:
                    continue

                dv_result = service.spreadsheets().get(
                    spreadsheetId=SPREADSHEET_ID,
                    fields="sheets.properties,sheets.data.rowData.values.dataValidation,sheets.data.rowData.values.effectiveValue,sheets.data.rowData.values.formattedValue",
                ).execute()
                for dvsh in dv_result.get("sheets", []):
                    if dvsh.get("properties", {}).get("sheetId") != SHEET_GID:
                        continue
                    for row_data in (dvsh.get("data") or [{}])[0].get("rowData", [])[:3]:
                        for cell in row_data.get("values") or []:
                            validation = cell.get("dataValidation")
                            formatted_value = cell.get("formattedValue", "")
                            if validation:
                                cond = validation.get("condition", {})
                                vals = [v.get("userEnteredValue", "") for v in cond.get("values", [])]
                                raw_cells.append(
                                    {
                                        "formattedValue": formatted_value,
                                        "validationType": cond.get("type"),
                                        "validationValues": vals,
                                        "strict": validation.get("strict"),
                                        "codepoints": [f"U+{ord(char):04X}" for val in vals for char in val],
                                    }
                                )

            return jsonify({"validations": raw_cells[:10]})
        except Exception as exc:
            return jsonify(error_payload("No se pudo inspeccionar caracteres", exc)), 500

    @app.route("/api/status")
    def api_status():
        user = get_current_user()
        return jsonify(
            {
                "connected": is_connected(),
                "user": user,
                "auth_url": url_for("auth", _external=True),
                "redirect_uri": get_redirect_uri(),
                "vercel": bool(os.environ.get("VERCEL")),
            }
        )

    @app.route("/healthz")
    def healthz():
        return jsonify({"ok": True, "service": "asistencia", "ts": datetime.now().isoformat()})
