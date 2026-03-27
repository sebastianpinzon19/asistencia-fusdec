'use client'

import { useState } from 'react'
import { Menu, X, LogOut, FileText, RefreshCw, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  brigadas: string[]
  selectedBrigada: string
  onBrigadaChange: (brigada: string) => void
  onRefresh: () => void
  isLoading: boolean
  demoMode: boolean
  pendingCount: number
}

export default function Header({
  brigadas,
  selectedBrigada,
  onBrigadaChange,
  onRefresh,
  isLoading,
  demoMode,
  pendingCount,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [brigadaOpen, setBrigadaOpen] = useState(false)
  
  return (
    <header className="sticky top-0 z-50 bg-primary-600 text-white shadow-lg safe-top">
      <div className="flex items-center justify-between p-3 sm:p-4">
        {/* Logo y titulo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold">F</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg leading-tight">FUSDEC</h1>
            <p className="text-xs text-white/80">Control de Asistencia</p>
          </div>
        </div>
        
        {/* Selector de brigada - Desktop */}
        <div className="hidden md:block relative">
          <button
            onClick={() => setBrigadaOpen(!brigadaOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <span className="font-medium">{selectedBrigada || 'Seleccionar brigada'}</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', brigadaOpen && 'rotate-180')} />
          </button>
          
          {brigadaOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBrigadaOpen(false)} />
              <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl overflow-hidden z-50 min-w-[200px]">
                {brigadas.map((brigada) => (
                  <button
                    key={brigada}
                    onClick={() => {
                      onBrigadaChange(brigada)
                      setBrigadaOpen(false)
                    }}
                    className={cn(
                      'w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition-colors',
                      selectedBrigada === brigada && 'bg-primary-50 text-primary-700 font-medium'
                    )}
                  >
                    {brigada}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Badge de cambios pendientes */}
          {pendingCount > 0 && (
            <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
              {pendingCount} pendientes
            </span>
          )}
          
          {/* Demo badge */}
          {demoMode && (
            <span className="hidden sm:inline-block px-2 py-1 bg-orange-400 text-orange-900 text-xs font-bold rounded-full">
              DEMO
            </span>
          )}
          
          {/* Refrescar */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            aria-label="Refrescar datos"
          >
            <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
          </button>
          
          {/* Menu hamburguesa - Mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10">
          {/* Selector de brigada mobile */}
          <div className="p-3 border-b border-white/10">
            <label className="text-xs text-white/70 block mb-2">Brigada:</label>
            <select
              value={selectedBrigada}
              onChange={(e) => {
                onBrigadaChange(e.target.value)
                setMenuOpen(false)
              }}
              className="w-full px-3 py-2.5 bg-white/10 rounded-lg text-white appearance-none"
            >
              {brigadas.map((brigada) => (
                <option key={brigada} value={brigada} className="text-gray-900">
                  {brigada}
                </option>
              ))}
            </select>
          </div>
          
          {/* Links del menu */}
          <nav className="p-2">
            <a
              href="/logs"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Ver historial</span>
            </a>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar sesion</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
