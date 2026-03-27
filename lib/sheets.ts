import { google } from 'googleapis'

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1Jkk4yHJTLGF9LwYrrw5qkLy4PaKi5hJT_eiOnWg7LbE'
const SHEET_GID = 1547008662
export const DAY_COLS = Array.from({ length: 14 }, (_, i) => `DIA ${i + 1}`)

// Valores de asistencia permitidos
export const ATTENDANCE_VALUES = new Set(['', '\u2713', '\u00d7', 'E'])

function getServiceAccountCredentials() {
  const envJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!envJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurado')
  }
  
  try {
    return JSON.parse(envJson)
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no es JSON valido')
  }
}

async function getSheetsClient() {
  const credentials = getServiceAccountCredentials()
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  })
  
  return google.sheets({ version: 'v4', auth })
}

export async function getBrigadas(): Promise<string[]> {
  const sheets = await getSheetsClient()
  
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties.title,sheets.properties.sheetId',
  })
  
  const allSheets = response.data.sheets || []
  
  // Si hay 2 o menos hojas, retornar todas
  if (allSheets.length <= 2) {
    return allSheets.map(s => s.properties?.title || '').filter(Boolean)
  }
  
  // Retornar todas excepto la primera y ultima (que suelen ser config/logs)
  return allSheets
    .slice(1, -1)
    .map(s => s.properties?.title || '')
    .filter(Boolean)
}

export async function getSheetData(brigadaName?: string) {
  const sheets = await getSheetsClient()
  
  // Obtener informacion de hojas
  const metaResponse = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties',
  })
  
  const allSheets = metaResponse.data.sheets || []
  
  // Determinar cual hoja usar
  let targetSheet = allSheets.find(s => s.properties?.title === brigadaName)
  
  if (!targetSheet) {
    // Buscar por GID o usar la segunda hoja
    targetSheet = allSheets.find(s => s.properties?.sheetId === SHEET_GID)
    if (!targetSheet && allSheets.length > 1) {
      targetSheet = allSheets[1]
    } else if (!targetSheet) {
      targetSheet = allSheets[0]
    }
  }
  
  const sheetTitle = targetSheet?.properties?.title || 'Sheet1'
  
  // Obtener datos de la hoja
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetTitle}'!A1:Z1000`,
  })
  
  const values = dataResponse.data.values || []
  
  if (values.length === 0) {
    return { headers: [], students: [], activeDay: 1, sheetTitle }
  }
  
  const headers = values[0].map((h: string) => (h || '').trim())
  
  const students = values.slice(1).map((row, index) => {
    const obj: Record<string, string | number> = {
      _row: index + 2,
      _sheet: sheetTitle,
    }
    
    headers.forEach((header: string, i: number) => {
      obj[header] = (row[i] || '').trim()
    })
    
    return obj
  }).filter(s => Object.values(s).some(v => v && v !== s._row && v !== s._sheet))
  
  // Detectar dia activo
  let activeDay = 1
  for (const day of DAY_COLS) {
    if (students.some(s => s[day] && String(s[day]).trim())) {
      activeDay = parseInt(day.split(' ')[1])
    }
  }
  
  return { headers, students, activeDay, sheetTitle }
}

export function normalizeAttendanceValue(value: unknown): string {
  const raw = value == null ? '' : String(value).trim()
  
  const ALIASES: Record<string, string> = {
    'P': '\u2713', 'p': '\u2713', '1': '\u2713', 'presente': '\u2713', 'PRESENTE': '\u2713',
    'A': '\u00d7', 'a': '\u00d7', '0': '\u00d7', 'ausente': '\u00d7', 'AUSENTE': '\u00d7', 'X': '\u00d7', 'x': '\u00d7',
    'e': 'E', 'excusa': 'E', 'EXCUSA': 'E', 'J': 'E', 'j': 'E',
    '': '', ' ': '',
  }
  
  if (ATTENDANCE_VALUES.has(raw)) {
    return raw
  }
  
  if (raw in ALIASES) {
    return ALIASES[raw]
  }
  
  return ''
}

interface UpdateItem {
  row: number
  day: string
  value: string
}

export async function updateAttendanceBulk(updates: UpdateItem[], brigadaName?: string) {
  const sheets = await getSheetsClient()
  
  // Obtener informacion de la hoja
  const metaResponse = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties',
  })
  
  const allSheets = metaResponse.data.sheets || []
  let targetSheet = allSheets.find(s => s.properties?.title === brigadaName)
  
  if (!targetSheet) {
    targetSheet = allSheets.find(s => s.properties?.sheetId === SHEET_GID)
    if (!targetSheet && allSheets.length > 1) {
      targetSheet = allSheets[1]
    } else if (!targetSheet) {
      targetSheet = allSheets[0]
    }
  }
  
  const sheetTitle = targetSheet?.properties?.title || 'Sheet1'
  
  // Obtener headers para mapear columnas
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetTitle}'!1:1`,
  })
  
  const headers = (headerResponse.data.values?.[0] || []).map((h: string) => (h || '').trim())
  
  // Preparar datos para actualizar
  const data = updates.map(update => {
    const colIndex = headers.indexOf(update.day)
    if (colIndex === -1) {
      throw new Error(`Columna no encontrada: ${update.day}`)
    }
    
    const colLetter = String.fromCharCode(65 + colIndex)
    const range = `'${sheetTitle}'!${colLetter}${update.row}`
    
    return {
      range,
      values: [[normalizeAttendanceValue(update.value)]],
    }
  })
  
  // Ejecutar actualizacion en batch
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  })
  
  return { updated: updates.length }
}

export async function logChanges(
  updates: UpdateItem[],
  userEmail: string,
  userName: string,
  brigada: string
) {
  try {
    const sheets = await getSheetsClient()
    
    // Verificar/crear hoja de LOGS
    const metaResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties',
    })
    
    const allSheets = metaResponse.data.sheets || []
    let logSheet = allSheets.find(s => s.properties?.title === 'LOGS')
    
    if (!logSheet) {
      // Crear hoja de LOGS
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title: 'LOGS' }
            }
          }]
        }
      })
      
      // Agregar headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "'LOGS'!A1:I1",
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['FECHA', 'HORA', 'EMAIL', 'NOMBRE', 'BRIGADA', 'FILA', 'ESTUDIANTE', 'DIA', 'ASISTENCIA']]
        }
      })
    }
    
    // Agregar registros de log
    const now = new Date()
    const fecha = now.toLocaleDateString('es-CO')
    const hora = now.toLocaleTimeString('es-CO')
    
    const rows = updates.map(update => [
      fecha,
      hora,
      userEmail,
      userName,
      brigada,
      update.row,
      '', // estudiante (se puede agregar si se necesita)
      update.day,
      update.value,
    ])
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "'LOGS'!A:I",
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    })
  } catch (error) {
    console.error('Error guardando log:', error)
  }
}

export async function getLogs() {
  const sheets = await getSheetsClient()
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'LOGS'!A:I",
    })
    
    const values = response.data.values || []
    const headers = values[0] || []
    const entries = values.slice(1).reverse()
    
    return { headers, entries }
  } catch {
    return { headers: [], entries: [] }
  }
}
