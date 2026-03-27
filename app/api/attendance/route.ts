import { NextRequest, NextResponse } from 'next/server'
import { updateAttendanceBulk, logChanges, normalizeAttendanceValue, DAY_COLS } from '@/lib/sheets'

interface UpdateItem {
  row: number
  day: string
  value: string
}

export async function POST(request: NextRequest) {
  // Si no hay credenciales, simular guardado exitoso (modo demo)
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return NextResponse.json({
      success: true,
      updated: 0,
      demo_mode: true,
      message: 'Modo demo - los cambios no se guardan realmente',
    })
  }
  
  try {
    const body = await request.json()
    const { updates, brigada, userEmail, userName } = body
    
    if (!Array.isArray(updates)) {
      return NextResponse.json({
        success: false,
        error: 'Formato de updates invalido',
      }, { status: 400 })
    }
    
    if (updates.length > 2000) {
      return NextResponse.json({
        success: false,
        error: 'Demasiados cambios en una sola solicitud (max 2000)',
      }, { status: 400 })
    }
    
    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        message: 'Sin cambios pendientes',
      })
    }
    
    // Validar y normalizar cada update
    const validUpdates: UpdateItem[] = []
    const errors: string[] = []
    
    for (const update of updates) {
      const row = parseInt(String(update.row || update.rowNumber))
      const day = String(update.day || update.dayColumn || '').trim()
      const value = normalizeAttendanceValue(update.value)
      
      if (isNaN(row) || row < 2 || row > 20000) {
        errors.push(`Fila invalida: ${update.row}`)
        continue
      }
      
      if (!DAY_COLS.includes(day)) {
        errors.push(`Dia invalido: ${day}`)
        continue
      }
      
      validUpdates.push({ row, day, value })
    }
    
    if (validUpdates.length > 0) {
      await updateAttendanceBulk(validUpdates, brigada)
      
      // Registrar cambios en log
      await logChanges(
        validUpdates,
        userEmail || 'unknown@email.com',
        userName || 'Usuario',
        brigada || ''
      )
    }
    
    return NextResponse.json({
      success: true,
      updated: validUpdates.length,
      errors: errors.length > 0 ? errors : undefined,
      savedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error guardando asistencia:', error)
    return NextResponse.json({
      success: false,
      error: 'No se pudo guardar la asistencia',
      detail: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 })
  }
}
