import { NextResponse } from 'next/server'
import { getLogs } from '@/lib/sheets'

export async function GET() {
  // Si no hay credenciales, retornar logs demo
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const demoLogs = [
      ['27/03/2026', '10:30:15', 'instructor@fusdec.edu.co', 'Juan Instructor', 'BRIGADA ALPHA', '2', 'MARTINEZ LOPEZ, CARLOS ANDRES', 'DIA 4', '\u2713'],
      ['27/03/2026', '10:30:10', 'instructor@fusdec.edu.co', 'Juan Instructor', 'BRIGADA ALPHA', '3', 'RODRIGUEZ PEREZ, MARIA FERNANDA', 'DIA 4', '\u2713'],
      ['27/03/2026', '10:29:55', 'instructor@fusdec.edu.co', 'Juan Instructor', 'BRIGADA ALPHA', '4', 'GONZALEZ CASTRO, JUAN PABLO', 'DIA 4', '\u00d7'],
      ['26/03/2026', '09:15:22', 'admin@fusdec.edu.co', 'Admin FUSDEC', 'BRIGADA BRAVO', '5', 'HERNANDEZ RIOS, ANA LUCIA', 'DIA 3', 'E'],
      ['26/03/2026', '09:14:18', 'admin@fusdec.edu.co', 'Admin FUSDEC', 'BRIGADA BRAVO', '6', 'SANCHEZ MORA, DIEGO ALEJANDRO', 'DIA 3', '\u2713'],
    ]
    
    return NextResponse.json({
      success: true,
      headers: ['FECHA', 'HORA', 'EMAIL', 'NOMBRE', 'BRIGADA', 'FILA', 'ESTUDIANTE', 'DIA', 'ASISTENCIA'],
      entries: demoLogs,
      demo_mode: true,
    })
  }
  
  try {
    const { headers, entries } = await getLogs()
    
    return NextResponse.json({
      success: true,
      headers,
      entries,
    })
  } catch (error) {
    console.error('Error cargando logs:', error)
    return NextResponse.json({
      success: false,
      error: 'No se pudo cargar el historial',
      headers: [],
      entries: [],
    }, { status: 500 })
  }
}
