import { NextResponse } from 'next/server'
import { getBrigadas } from '@/lib/sheets'

export async function GET() {
  // Si no hay credenciales, retornar brigadas demo
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return NextResponse.json({
      success: true,
      brigadas: ['BRIGADA ALPHA', 'BRIGADA BRAVO', 'BRIGADA CHARLIE'],
      demo_mode: true,
    })
  }
  
  try {
    const brigadas = await getBrigadas()
    
    return NextResponse.json({
      success: true,
      brigadas,
    })
  } catch (error) {
    console.error('Error cargando brigadas:', error)
    return NextResponse.json({
      success: false,
      error: 'No se pudo cargar las brigadas',
    }, { status: 500 })
  }
}
