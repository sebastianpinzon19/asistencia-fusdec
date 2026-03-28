import { google } from 'googleapis'

const SPREADSHEET_ID = '1Jkk4yHJTLGF9LwYrrw5qkLy4PaKi5hJT_eiOnWg7LbE'
const SHEET_GID = 1547008662
export const DAY_COLS = Array.from({ length: 14 }, (_, i) => `DIA ${i + 1}`)

// Valores de asistencia permitidos
export const ATTENDANCE_VALUES = new Set(['', '\u2713', '\u00d7', 'E'])

// Credenciales de servicio
const SERVICE_ACCOUNT_CREDENTIALS = {
  type: "service_account",
  project_id: "thinking-banner-489220-d9",
  private_key_id: "c8e7859b68a0442a2ce30b17f46f23b39718ef31",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDJAQ66Qs4dxeq6\nlT2ZDl2kFa8vbWi3LHNdaS23OhsM0R0z8lrqDyXSqTbuwHI0RckZ9nH5jVzSoI0G\ny5WjbtwavQzq0HSD5tvYd3WNcvd6AUjGQ8eLZF8UXHXM3b2bziE+YVixu6wj3fGM\nwb3vbErYV23QiaBLJ8fW7nBJCmX2TMG6WEePvGketNyh4OXajJi0RlksCT0010wK\nYRrg416p1iyLO/UOQG221BD7o6LN5akunBj/y1eDAWGcqoMtKqqy1ogCWqZvj+9N\nwi0xOSUGIz9K/jiSamwJOF991eft7L9kSJFHk7rlT13oO2NWVL/SxeUfV728h2v6\nagLUnjelAgMBAAECggEAAL0XwZh4QG9sluXwgCz81sWw9fLSz9rXy6/qF+0ckgCn\nY6b62DcDs7v6dIh8LZ6qCAXkp6mc0zX9fq5l14q96qfnhxS1W5IQHGyyn7lHQ96t\nq/ODerV84fVwW2HfOKuFFMEafdYLjRAw5eGvtymwjA36MdTSTs8PyBrqimIsO2pN\ndbVfRoHaG1QWLmx596koeeb8s80oc5rFcHWGiy8JSURQxlXfjHNsuLtqU4VytM9f\nX2gtP9FTTWrVIGqsW9YnTn1x/70M5YmaK9rfXgmq3F8944lBzSrUlPOgrLALrx3x\nvHPqRZ4Fh1QUIqsGoTHRp5MClQetdoWbyuhKiVse2wKBgQDn1/+XHdtjC1fJlevv\nSAsubhrXIJfkVmOIs7vF8doFWuVBDiGcciauKmK1d4TLfzT+XGkDjwZswQtQT8tM\nf9OA7hr5E0Ha7DIsHmjzp9YEwqlnFwwwYJeUIC2PG3+aNSNhsh9FYVFu3uK+Gz9y\nSmr5nepHM14PCLZejzDRIi4glwKBgQDd8ng9xYqf1pGBDbzrFokQkMtf5mMVF0L/\nJtlqJd83U0MUQLXXSnT7FfPdRDo8jBTsmwymiujuOFbtx65g1NWuqj6rnboL6CxK\nDRwLZIAcgE+UaJW5ysCCCnsAPLjD5MN/pLacS/4chxuFrDb5fjzYvrFJMghk98Vh\nMyam0oO1IwKBgH3dQrHMkLztfIRA8uxdhUx4k/O0iyF4UOL3CHrG+OCtXwZ5YH/p\nbNxiwGHZ9+ruLVvl2VEIRamnB7hbCXiHcNBu84/DB56NWhOfksSsmkDNWWBRH9nn\npoLREUq+2ABk1seEBvwIgEgbkqc4bbJjej33oCd1WJv60970B8GRt88TAoGBAJx0\nLdqtg9jEsnEctA2sJxasWxDRIQtfCHVAd4ZiCAXCBckjDIwlCm1svik9zSedP6rC\naZqE1UoIIQ8g8YWEwtSLYf4sA1gdZAsXTquhPsXYlUBysQj1KdsBdE9ofn5opn82\nJxvqXcjSXM5P5bjeChpn4iVMxaoXFuY73oU+ZGWtAoGAT8T3nSIdPbeqxrqi0DZm\nMikez3Ymz52IR9B6aYbDkeP8xQTCZgEb/wqaw+O3nJJFy0cmBZD6iqW3LAAGz27J\nQtmBsqIdPGCCl8LZs8lIC/vVwxDLNlu8C9DxKkLO5ycFwrUsNxi1xAHOy0c/PIKk\ntSNEMfC8dSswc+4wbFpWikQ=\n-----END PRIVATE KEY-----\n",
  client_email: "asistencia-sheets@thinking-banner-489220-d9.iam.gserviceaccount.com",
  client_id: "112367656560489453396",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/asistencia-sheets%40thinking-banner-489220-d9.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
}

function getServiceAccountCredentials() {
  return SERVICE_ACCOUNT_CREDENTIALS
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
