'use client'

import { useState, useCallback, useMemo } from 'react'
import { Check, X, Clock, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Student {
  _row: number
  _sheet: string
  [key: string]: string | number
}

interface PendingChange {
  row: number
  day: string
  value: string
  studentName: string
}

interface AttendanceTableProps {
  students: Student[]
  headers: string[]
  dayColumns: string[]
  activeDay: number
  pendingChanges: PendingChange[]
  onAttendanceChange: (row: number, day: string, value: string, studentName: string) => void
  searchTerm: string
}

const ATTENDANCE_OPTIONS = [
  { value: '\u2713', label: 'Presente', icon: Check, color: 'bg-green-500 text-white' },
  { value: '\u00d7', label: 'Ausente', icon: X, color: 'bg-red-500 text-white' },
  { value: 'E', label: 'Excusa', icon: Clock, color: 'bg-yellow-500 text-white' },
  { value: '', label: 'Sin marcar', icon: Minus, color: 'bg-gray-200 text-gray-600' },
]

export default function AttendanceTable({
  students,
  headers,
  dayColumns,
  activeDay,
  pendingChanges,
  onAttendanceChange,
  searchTerm,
}: AttendanceTableProps) {
  const [selectedDay, setSelectedDay] = useState(`DIA ${activeDay}`)
  
  // Encontrar columna de nombre
  const nameColumn = useMemo(() => {
    return headers.find(h => h.toUpperCase().includes('NOMBRE')) || headers[1] || 'NOMBRE'
  }, [headers])
  
  // Filtrar estudiantes
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students
    
    const term = searchTerm.toLowerCase()
    return students.filter(student => {
      const name = String(student[nameColumn] || '').toLowerCase()
      const doc = String(student.DOCUMENTO || student.ID || '').toLowerCase()
      return name.includes(term) || doc.includes(term)
    })
  }, [students, searchTerm, nameColumn])
  
  // Obtener valor actual (considerando cambios pendientes)
  const getCurrentValue = useCallback((row: number, day: string) => {
    const pending = pendingChanges.find(c => c.row === row && c.day === day)
    if (pending) return pending.value
    
    const student = students.find(s => s._row === row)
    return student ? String(student[day] || '') : ''
  }, [students, pendingChanges])
  
  // Verificar si hay cambio pendiente
  const hasPendingChange = useCallback((row: number, day: string) => {
    return pendingChanges.some(c => c.row === row && c.day === day)
  }, [pendingChanges])
  
  // Ciclar valor de asistencia
  const cycleAttendance = useCallback((student: Student) => {
    const current = getCurrentValue(student._row, selectedDay)
    const currentIndex = ATTENDANCE_OPTIONS.findIndex(o => o.value === current)
    const nextIndex = (currentIndex + 1) % ATTENDANCE_OPTIONS.length
    const nextValue = ATTENDANCE_OPTIONS[nextIndex].value
    
    onAttendanceChange(
      student._row,
      selectedDay,
      nextValue,
      String(student[nameColumn] || '')
    )
  }, [getCurrentValue, selectedDay, onAttendanceChange, nameColumn])
  
  // Marcar todos presentes
  const markAllPresent = useCallback(() => {
    filteredStudents.forEach(student => {
      const current = getCurrentValue(student._row, selectedDay)
      if (current !== '\u2713') {
        onAttendanceChange(
          student._row,
          selectedDay,
          '\u2713',
          String(student[nameColumn] || '')
        )
      }
    })
  }, [filteredStudents, getCurrentValue, selectedDay, onAttendanceChange, nameColumn])
  
  // Marcar todos ausentes
  const markAllAbsent = useCallback(() => {
    filteredStudents.forEach(student => {
      const current = getCurrentValue(student._row, selectedDay)
      if (current !== '\u00d7') {
        onAttendanceChange(
          student._row,
          selectedDay,
          '\u00d7',
          String(student[nameColumn] || '')
        )
      }
    })
  }, [filteredStudents, getCurrentValue, selectedDay, onAttendanceChange, nameColumn])
  
  // Estadisticas del dia seleccionado
  const stats = useMemo(() => {
    let present = 0, absent = 0, excuse = 0, unmarked = 0
    
    filteredStudents.forEach(student => {
      const value = getCurrentValue(student._row, selectedDay)
      if (value === '\u2713') present++
      else if (value === '\u00d7') absent++
      else if (value === 'E') excuse++
      else unmarked++
    })
    
    return { present, absent, excuse, unmarked, total: filteredStudents.length }
  }, [filteredStudents, getCurrentValue, selectedDay])
  
  const getAttendanceStyle = (value: string) => {
    const option = ATTENDANCE_OPTIONS.find(o => o.value === value)
    return option?.color || 'bg-gray-100 text-gray-500'
  }
  
  const getAttendanceIcon = (value: string) => {
    const option = ATTENDANCE_OPTIONS.find(o => o.value === value)
    if (!option) return <Minus className="w-5 h-5" />
    const Icon = option.icon
    return <Icon className="w-5 h-5" />
  }

  return (
    <div className="flex flex-col h-full">
      {/* Selector de dia */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Seleccionar dia:</label>
            <div className="flex gap-2">
              <button
                onClick={markAllPresent}
                className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                Todos presentes
              </button>
              <button
                onClick={markAllAbsent}
                className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Todos ausentes
              </button>
            </div>
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
            {dayColumns.map((day) => {
              const dayNum = parseInt(day.split(' ')[1])
              const isActive = day === selectedDay
              const isPast = dayNum < activeDay
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    'flex-shrink-0 px-3 py-2 text-sm font-medium rounded-lg transition-all min-w-[52px]',
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : isPast
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  )}
                >
                  {dayNum}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Estadisticas */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{stats.present}</div>
            <div className="text-xs text-green-700">Presentes</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{stats.absent}</div>
            <div className="text-xs text-red-700">Ausentes</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{stats.excuse}</div>
            <div className="text-xs text-yellow-700">Excusas</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-600">{stats.unmarked}</div>
            <div className="text-xs text-gray-700">Sin marcar</div>
          </div>
        </div>
      </div>
      
      {/* Lista de estudiantes */}
      <div className="flex-1 overflow-y-auto">
        {filteredStudents.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-500">
            {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredStudents.map((student) => {
              const value = getCurrentValue(student._row, selectedDay)
              const isPending = hasPendingChange(student._row, selectedDay)
              
              return (
                <button
                  key={student._row}
                  onClick={() => cycleAttendance(student)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 sm:p-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100',
                    isPending && 'bg-blue-50'
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                      getAttendanceStyle(value),
                      isPending && 'ring-2 ring-blue-400 ring-offset-2'
                    )}
                  >
                    {getAttendanceIcon(value)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {String(student[nameColumn] || 'Sin nombre')}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {student.DOCUMENTO || student.ID || `Fila ${student._row}`}
                      {student.UNIDAD && ` - ${student.UNIDAD}`}
                    </div>
                  </div>
                  
                  {isPending && (
                    <span className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      Pendiente
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
