import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, DAY_COLS } from '@/lib/sheets'
import { DEMO_HEADERS, DEMO_STUDENTS } from '@/lib/demo-data'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const brigada = searchParams.get('brigada') || ''
  
  // Si no hay credenciales, usar modo demo
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return NextResponse.json({
      success: true,
      demo_mode: true,
      headers: DEMO_HEADERS,
      students: DEMO_STUDENTS,
      activeDay: 4,
      dayColumns: DAY_COLS,
      fetchedAt: new Date().toISOString(),
      warning: 'Modo demo - Configura GOOGLE_SERVICE_ACCOUNT_JSON para conectar con Google Sheets',
    })
  }
  
  try {
    const { headers, students, activeDay, sheetTitle } = await getSheetData(brigada || undefined)
    
    return NextResponse.json({
      success: true,
      demo_mode: false,
      headers,
      students,
      activeDay,
      dayColumns: DAY_COLS,
      brigada: sheetTitle,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error cargando estudiantes:', error)
    return NextResponse.json({
      success: false,
      error: 'No se pudo cargar los estudiantes',
      detail: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 })
  }
}
