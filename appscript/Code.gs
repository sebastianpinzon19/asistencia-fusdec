// ================================================================
//  SISTEMA DE ASISTENCIA — Google Apps Script Backend v2
//  Conectado a: https://docs.google.com/spreadsheets/d/1lfGI10Gf6ka3CaGgMgH1aSvTEd3UIR2M5RKpvak4HRc
// ================================================================
const SPREADSHEET_ID = '1lfGI10Gf6ka3CaGgMgH1aSvTEd3UIR2M5RKpvak4HRc';
const SHEET_GID      = 1547008662;
const DAY_COLS       = Array.from({length:14}, (_,i) => `DIA ${i+1}`);

// ── Punto de entrada ──────────────────────────────────────────
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sistema de Asistencia')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ── Helpers ───────────────────────────────────────────────────
function _getSheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return ss.getSheets().find(s => s.getSheetId() === SHEET_GID) || ss.getSheets()[0];
  } catch(e) {
    throw new Error('No se puede abrir la hoja: ' + e.message);
  }
}

function _getHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
}

function _normalizeAttendanceValue(value) {
  const raw = value === null || value === undefined ? '' : String(value).trim();
  const allowed = new Set(['', 'P', 'A', 'T', 'J', '✓', '×', 'E']);
  if (!allowed.has(raw)) throw new Error('Valor de asistencia inválido: ' + raw);
  return raw;
}

function _validateBulkUpdate(update, headers, maxRow) {
  if (!update || typeof update !== 'object') {
    throw new Error('Update inválido: se esperaba objeto');
  }
  const rowNumber = Number(update.rowNumber);
  const dayColumn = String(update.dayColumn || '').trim();
  const value = _normalizeAttendanceValue(update.value);

  if (!Number.isInteger(rowNumber) || rowNumber < 2 || rowNumber > maxRow) {
    throw new Error('Fila fuera de rango: ' + update.rowNumber);
  }
  if (!DAY_COLS.includes(dayColumn)) {
    throw new Error('Columna de día inválida: ' + dayColumn);
  }
  if (!headers.includes(dayColumn)) {
    throw new Error('Columna no encontrada en la hoja: ' + dayColumn);
  }

  return { rowNumber, dayColumn, value };
}

// ── Leer estudiantes completos ────────────────────────────────
function getStudents() {
  const sheet   = _getSheet();
  const data    = sheet.getDataRange().getValues();
  if (data.length < 2) return { headers: [], students: [] };

  const headers  = data[0].map(h => String(h).trim());
  const students = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.every(c => c === '' || c === null || c === undefined)) continue;
    const obj = { _row: i + 1 };
    headers.forEach((h, j) => {
      obj[h] = (row[j] !== undefined && row[j] !== null) ? String(row[j]).trim() : '';
    });
    students.push(obj);
  }
  return { headers, students };
}

// ── Detectar día activo (último con algún dato) ───────────────
function getActiveDay() {
  const { students } = getStudents();
  let lastDay = 1;
  DAY_COLS.forEach((day, idx) => {
    const hasData = students.some(s => s[day] && s[day] !== '');
    if (hasData) lastDay = idx + 1;
  });
  return lastDay;
}

// ── Guardar asistencia masiva ─────────────────────────────────
// updates: [{ rowNumber: int, dayColumn: string, value: string }]
function markBulkAttendance(updates) {
  if (!updates || updates.length === 0) return { success: true, updated: 0 };
  if (!Array.isArray(updates)) return { success: false, error: 'Formato de updates inválido' };
  if (updates.length > 2000) return { success: false, error: 'Demasiados cambios en una sola solicitud' };
  try {
    const sheet   = _getSheet();
    const headers = _getHeaders(sheet);
    const maxRow = Math.max(2, sheet.getLastRow());
    updates
      .map(u => _validateBulkUpdate(u, headers, maxRow))
      .forEach(u => {
        const colIdx = headers.indexOf(u.dayColumn) + 1;
        sheet.getRange(u.rowNumber, colIdx).setValue(u.value);
      });
    SpreadsheetApp.flush();
    return { success: true, updated: updates.length };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// ── Resumen de asistencia por estudiante ──────────────────────
// Devuelve P, A, T, J y % de asistencia por cada alumno
function getAttendanceSummary() {
  const { students } = getStudents();
  return students.map(s => {
    const summary = { _row: s._row, name: s['NOMBRES Y APELLIDOS'], counts: {P:0,A:0,T:0,J:0,empty:0} };
    let daysRecorded = 0;
    DAY_COLS.forEach(d => {
      const v = s[d] || '';
      if      (v === 'P') { summary.counts.P++;     daysRecorded++; }
      else if (v === 'A') { summary.counts.A++;     daysRecorded++; }
      else if (v === 'T') { summary.counts.T++;     daysRecorded++; }
      else if (v === 'J') { summary.counts.J++;     daysRecorded++; }
      else                { summary.counts.empty++; }
    });
    summary.daysRecorded = daysRecorded;
    summary.pct = daysRecorded > 0 ? Math.round((summary.counts.P / daysRecorded) * 100) : null;
    return summary;
  });
}

// ── Metadata de la hoja ───────────────────────────────────────
function getSheetMeta() {
  const sheet = _getSheet();
  return {
    name:     sheet.getName(),
    lastRow:  sheet.getLastRow() - 1, // minus header
    sheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=${SHEET_GID}`
  };
}

// ── Carga completa en una sola llamada ────────────────────────
function getFullData() {
  const { headers, students } = getStudents();
  const activeDay = getActiveDay();
  const meta      = getSheetMeta();
  return { headers, students, activeDay, meta };
}
