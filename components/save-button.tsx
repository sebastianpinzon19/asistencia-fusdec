'use client'

import { Save, Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SaveButtonProps {
  pendingCount: number
  isSaving: boolean
  lastSaved: Date | null
  onSave: () => void
}

export default function SaveButton({
  pendingCount,
  isSaving,
  lastSaved,
  onSave,
}: SaveButtonProps) {
  if (pendingCount === 0 && !isSaving) {
    return null
  }
  
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-white border-t border-gray-200 shadow-lg safe-bottom">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {isSaving ? 'Guardando cambios...' : `${pendingCount} cambios pendientes`}
          </p>
          {lastSaved && !isSaving && (
            <p className="text-sm text-gray-500">
              Ultimo guardado: {lastSaved.toLocaleTimeString('es-CO')}
            </p>
          )}
        </div>
        
        <button
          onClick={onSave}
          disabled={isSaving || pendingCount === 0}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all',
            'bg-primary-600 text-white hover:bg-primary-700',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'active:scale-95'
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Guardando</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Guardar</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export function SaveSuccessToast({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-xl shadow-lg">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Cambios guardados correctamente</span>
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:bg-white/20 rounded"
        >
          <span className="sr-only">Cerrar</span>
          &times;
        </button>
      </div>
    </div>
  )
}
