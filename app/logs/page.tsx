'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { ArrowLeft, Search, Filter, Calendar, User, Clock, ChevronLeft, ChevronRight, Check, X as XIcon, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  const { data, isLoading, error } = useSWR('/api/logs', fetcher)
  
  const logs = data?.entries || []
  const headers = data?.headers || []
  
  // Filtrar logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log: string[]) => {
      const [fecha, hora, email, nombre, brigada, fila, estudiante, dia, asistencia] = log
      
      // Busqueda general
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const searchable = [email, nombre, brigada, estudiante, dia].join(' ').toLowerCase()
        if (!searchable.includes(term)) return false
      }
      
      // Filtro por dia
      if (filterDay && dia !== filterDay) return false
      
      // Filtro por usuario
      if (filterUser && !email?.toLowerCase().includes(filterUser.toLowerCase())) return false
      
      return true
    })
  }, [logs, searchTerm, filterDay, filterUser])
  
  // Paginacion
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  // Estadisticas
  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString('es-CO')
    let todayCount = 0
    let presentCount = 0
    let absentCount = 0
    const uniqueUsers = new Set<string>()
    
    logs.forEach((log: string[]) => {
      const [fecha, , email, , , , , , asistencia] = log
      
      if (fecha === today) todayCount++
      if (asistencia === '\u2713') presentCount++
      if (asistencia === '\u00d7') absentCount++
      if (email) uniqueUsers.add(email)
    })
    
    return {
      total: logs.length,
      today: todayCount,
      present: presentCount,
      absent: absentCount,
      users: uniqueUsers.size,
    }
  }, [logs])
  
  const getAttendanceIcon = (value: string) => {
    if (value === '\u2713') return <Check className="w-4 h-4 text-green-600" />
    if (value === '\u00d7') return <XIcon className="w-4 h-4 text-red-600" />
    if (value === 'E') return <AlertCircle className="w-4 h-4 text-yellow-600" />
    return null
  }
  
  const getAttendanceBadge = (value: string) => {
    if (value === '\u2713') return 'bg-green-100 text-green-700'
    if (value === '\u00d7') return 'bg-red-100 text-red-700'
    if (value === 'E') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary-600 text-white shadow-lg safe-top">
        <div className="flex items-center gap-3 p-3 sm:p-4">
          <Link
            href="/"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg">Historial de Cambios</h1>
            <p className="text-xs text-white/80">Registro de asistencia</p>
          </div>
        </div>
      </header>
      
      <main className="p-3 sm:p-4 max-w-6xl mx-auto">
        {/* Estadisticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Total registros</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Hoy</span>
            </div>
            <p className="text-2xl font-bold text-primary-600">{stats.today}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <Check className="w-4 h-4" />
              <span className="text-xs">Presentes</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <XIcon className="w-4 h-4" />
              <span className="text-xs">Ausentes</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Buscar..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <select
              value={filterDay}
              onChange={(e) => {
                setFilterDay(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los dias</option>
              {Array.from({ length: 14 }, (_, i) => (
                <option key={i} value={`DIA ${i + 1}`}>DIA {i + 1}</option>
              ))}
            </select>
            
            <input
              type="text"
              value={filterUser}
              onChange={(e) => {
                setFilterUser(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Filtrar por usuario..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        {/* Lista de logs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              Error al cargar los logs
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              No hay registros
            </div>
          ) : (
            <>
              {/* Vista movil - Cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {paginatedLogs.map((log: string[], index: number) => {
                  const [fecha, hora, email, nombre, brigada, fila, estudiante, dia, asistencia] = log
                  
                  return (
                    <div key={index} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{estudiante || '-'}</p>
                          <p className="text-sm text-gray-500 truncate">{brigada}</p>
                        </div>
                        <span className={cn(
                          'flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1',
                          getAttendanceBadge(asistencia)
                        )}>
                          {getAttendanceIcon(asistencia)}
                          {asistencia || '-'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {fecha}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hora}
                        </span>
                        <span>{dia}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400 truncate">
                        Por: {nombre || email}
                      </p>
                    </div>
                  )
                })}
              </div>
              
              {/* Vista desktop - Tabla */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium">Hora</th>
                      <th className="px-4 py-3 text-left font-medium">Usuario</th>
                      <th className="px-4 py-3 text-left font-medium">Brigada</th>
                      <th className="px-4 py-3 text-left font-medium">Estudiante</th>
                      <th className="px-4 py-3 text-left font-medium">Dia</th>
                      <th className="px-4 py-3 text-left font-medium">Asistencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedLogs.map((log: string[], index: number) => {
                      const [fecha, hora, email, nombre, brigada, fila, estudiante, dia, asistencia] = log
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{fecha}</td>
                          <td className="px-4 py-3 text-gray-500">{hora}</td>
                          <td className="px-4 py-3 text-gray-900">{nombre || email}</td>
                          <td className="px-4 py-3 text-gray-500">{brigada}</td>
                          <td className="px-4 py-3 text-gray-900">{estudiante || '-'}</td>
                          <td className="px-4 py-3 text-gray-500">{dia}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1',
                              getAttendanceBadge(asistencia)
                            )}>
                              {getAttendanceIcon(asistencia)}
                              {asistencia || '-'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Paginacion */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} de {filteredLogs.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
