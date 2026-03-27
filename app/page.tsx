'use client'

import { useState, useCallback, useEffect } from 'react'
import useSWR from 'swr'
import Header from '@/components/header'
import SearchBar from '@/components/search-bar'
import AttendanceTable from '@/components/attendance-table'
import SaveButton, { SaveSuccessToast } from '@/components/save-button'
import { Loader2, AlertCircle, WifiOff } from 'lucide-react'

interface PendingChange {
  row: number
  day: string
  value: string
  studentName: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function HomePage() {
  const [selectedBrigada, setSelectedBrigada] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // Cargar brigadas
  const { data: brigadasData } = useSWR('/api/brigadas', fetcher)
  
  // Cargar estudiantes
  const studentsUrl = selectedBrigada 
    ? `/api/students?brigada=${encodeURIComponent(selectedBrigada)}`
    : '/api/students'
  
  const { 
    data: studentsData, 
    error: studentsError, 
    isLoading,
    mutate: refreshStudents,
  } = useSWR(studentsUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })
  
  // Seleccionar primera brigada automaticamente
  useEffect(() => {
    if (brigadasData?.brigadas?.length && !selectedBrigada) {
      setSelectedBrigada(brigadasData.brigadas[0])
    }
  }, [brigadasData, selectedBrigada])
  
  // Manejar cambio de asistencia
  const handleAttendanceChange = useCallback((
    row: number,
    day: string,
    value: string,
    studentName: string
  ) => {
    setPendingChanges(prev => {
      // Remover cambio existente para esta celda
      const filtered = prev.filter(c => !(c.row === row && c.day === day))
      
      // Si el valor es igual al original, no agregar
      const student = studentsData?.students?.find((s: { _row: number }) => s._row === row)
      const originalValue = student?.[day] || ''
      
      if (value === originalValue) {
        return filtered
      }
      
      return [...filtered, { row, day, value, studentName }]
    })
    
    // Limpiar error al hacer cambios
    setSaveError(null)
  }, [studentsData])
  
  // Guardar cambios
  const handleSave = useCallback(async () => {
    if (pendingChanges.length === 0 || isSaving) return
    
    setIsSaving(true)
    setSaveError(null)
    
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: pendingChanges.map(c => ({
            row: c.row,
            day: c.day,
            value: c.value,
          })),
          brigada: selectedBrigada,
          userEmail: 'usuario@fusdec.edu.co',
          userName: 'Usuario FUSDEC',
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setPendingChanges([])
        setLastSaved(new Date())
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
        
        // Refrescar datos
        refreshStudents()
      } else {
        setSaveError(result.error || 'Error al guardar')
      }
    } catch (error) {
      setSaveError('Error de conexion. Intenta de nuevo.')
      console.error('Error guardando:', error)
    } finally {
      setIsSaving(false)
    }
  }, [pendingChanges, isSaving, selectedBrigada, refreshStudents])
  
  // Manejar refresh
  const handleRefresh = useCallback(() => {
    if (pendingChanges.length > 0) {
      if (!confirm(`Tienes ${pendingChanges.length} cambios sin guardar. Continuar descartara los cambios.`)) {
        return
      }
      setPendingChanges([])
    }
    refreshStudents()
  }, [pendingChanges, refreshStudents])
  
  // Prevenir cierre accidental con cambios pendientes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChanges.length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pendingChanges])
  
  const brigadas = brigadasData?.brigadas || []
  const students = studentsData?.students || []
  const headers = studentsData?.headers || []
  const dayColumns = studentsData?.dayColumns || []
  const activeDay = studentsData?.activeDay || 1
  const demoMode = studentsData?.demo_mode || false

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        brigadas={brigadas}
        selectedBrigada={selectedBrigada}
        onBrigadaChange={setSelectedBrigada}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        demoMode={demoMode}
        pendingCount={pendingChanges.length}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Barra de busqueda */}
        <div className="flex-shrink-0 p-3 sm:p-4 bg-white border-b border-gray-200">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nombre o documento..."
          />
          
          {/* Demo mode warning */}
          {demoMode && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <strong>Modo Demo:</strong> Configura GOOGLE_SERVICE_ACCOUNT_JSON para conectar con Google Sheets real.
              </div>
            </div>
          )}
          
          {/* Error de guardado */}
          {saveError && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{saveError}</div>
            </div>
          )}
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
              <p>Cargando estudiantes...</p>
            </div>
          ) : studentsError ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 p-6">
              <WifiOff className="w-12 h-12 text-gray-400" />
              <p className="text-center">Error al cargar los datos</p>
              <button
                onClick={() => refreshStudents()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <AttendanceTable
              students={students}
              headers={headers}
              dayColumns={dayColumns}
              activeDay={activeDay}
              pendingChanges={pendingChanges}
              onAttendanceChange={handleAttendanceChange}
              searchTerm={searchTerm}
            />
          )}
        </div>
      </main>
      
      {/* Boton de guardar */}
      <SaveButton
        pendingCount={pendingChanges.length}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={handleSave}
      />
      
      {/* Toast de exito */}
      <SaveSuccessToast
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  )
}
