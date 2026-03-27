import json
import os

from .config import BASE_DIR, DAY_COLS, SHEET_GID, SHEET_SCOPES, SPREADSHEET_ID
from .demo import ATTENDANCE_VALUES


def get_service_account_creds():
    from google.oauth2 import service_account

    env = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if env:
        try:
            info = json.loads(env.strip())
        except json.JSONDecodeError as exc:
            raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON no es JSON válido") from exc
    else:
        sa_file = BASE_DIR / "service_account.json"
        if not sa_file.exists():
            raise RuntimeError("No se encontró GOOGLE_SERVICE_ACCOUNT_JSON ni service_account.json")
        try:
            info = json.loads(sa_file.read_text())
        except json.JSONDecodeError as exc:
            raise RuntimeError("service_account.json no es JSON válido") from exc

    return service_account.Credentials.from_service_account_info(info, scopes=SHEET_SCOPES)


def get_spreadsheet():
    import gspread
    from google.auth.transport.requests import AuthorizedSession

    creds = get_service_account_creds()
    client = gspread.Client(auth=creds)
    client.session = AuthorizedSession(creds)
    return client.open_by_key(SPREADSHEET_ID)


def get_brigadas():
    ss = get_spreadsheet()
    sheets = ss.worksheets()
    if len(sheets) <= 2:
        return [ws.title for ws in sheets]
    return [ws.title for ws in sheets[1:-1]]


def get_sheet(sheet_name=None, allow_fallback=True):
    import gspread

    ss = get_spreadsheet()
    if sheet_name:
        try:
            return ss.worksheet(sheet_name)
        except gspread.WorksheetNotFound:
            if not allow_fallback:
                raise RuntimeError(f"Brigada no encontrada: {sheet_name}")

    for ws in ss.worksheets():
        if ws.id == SHEET_GID:
            return ws

    sheets = ss.worksheets()
    if len(sheets) > 1:
        return sheets[1]
    return sheets[0]


def get_all_data(sheet_name=None):
    sheet = get_sheet(sheet_name, allow_fallback=(sheet_name is None))
    all_values = sheet.get_all_values()
    if not all_values:
        return [], []

    headers = [h.strip() for h in all_values[0]]
    students = []
    for i, row in enumerate(all_values[1:], start=2):
        if not any(row):
            continue
        padded = row + [""] * max(0, len(headers) - len(row))
        obj = {"_row": i, "_sheet": sheet.title}
        for j, h in enumerate(headers):
            obj[h] = padded[j].strip() if j < len(padded) else ""
        students.append(obj)

    return headers, students


def detect_active_day(students):
    last = 1
    for day in DAY_COLS:
        if any(s.get(day, "").strip() for s in students):
            last = int(day.split()[1])
    return last


def normalize_attendance_value(value):
    """Normaliza valores de asistencia, permitiendo variantes comunes."""
    raw = "" if value is None else str(value).strip()
    
    # Mapeo de valores alternativos a valores estandar
    ALIASES = {
        "P": "✓", "p": "✓", "1": "✓", "presente": "✓", "PRESENTE": "✓",
        "A": "×", "a": "×", "0": "×", "ausente": "×", "AUSENTE": "×", "X": "×", "x": "×",
        "e": "E", "excusa": "E", "EXCUSA": "E", "J": "E", "j": "E",
        "": "", " ": "",
    }
    
    # Primero verificar si es un valor directo permitido
    if raw in ATTENDANCE_VALUES:
        return raw
    
    # Luego verificar aliases
    if raw in ALIASES:
        return ALIASES[raw]
    
    # Si no es reconocido, limpiar el valor en lugar de fallar
    return ""


def parse_update_item(item):
    if not isinstance(item, dict):
        raise ValueError("Cada update debe ser un objeto")

    row = item.get("row", item.get("rowNumber"))
    day = (item.get("day", item.get("dayColumn", "")) or "").strip()
    value = normalize_attendance_value(item.get("value", ""))

    try:
        row = int(row)
    except Exception as exc:
        raise ValueError("Fila inválida") from exc

    if row < 2 or row > 20000:
        raise ValueError("Fila fuera de rango permitido")

    if day not in DAY_COLS:
        raise ValueError(f"Columna de día inválida: {day}")

    return {"row": row, "day": day, "value": value}


def get_or_create_log_sheet(spreadsheet):
    import gspread

    try:
        return spreadsheet.worksheet("LOGS")
    except gspread.WorksheetNotFound:
        ws = spreadsheet.add_worksheet(title="LOGS", rows=1000, cols=9)
        ws.append_row(
            ["FECHA", "HORA", "EMAIL", "NOMBRE", "BRIGADA", "FILA", "ESTUDIANTE", "DIA", "ASISTENCIA"],
            value_input_option="USER_ENTERED",
        )
        return ws
