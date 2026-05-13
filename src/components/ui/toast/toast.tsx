'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Bug, X } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { isDevModeEnabled, getLastApiError, type CapturedApiError } from '@/lib/dev-mode'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  capturedError?: CapturedApiError
}

interface ToastContextType {
  toast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [detailsToast, setDetailsToast] = useState<Toast | null>(null)
  const [devMode, setDevModeState] = useState(false)

  useEffect(() => {
    setDevModeState(isDevModeEnabled())
    function onChange() {
      setDevModeState(isDevModeEnabled())
    }
    window.addEventListener('faktur:dev-mode-change', onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener('faktur:dev-mode-change', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2)
    const capturedError = type === 'error' ? getLastApiError() : undefined
    setToasts((prev) => [...prev, { id, message, type, capturedError }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 6000)
  }, [])

  function copyDetails() {
    if (!detailsToast?.capturedError) return
    const text = JSON.stringify(detailsToast.capturedError, null, 2)
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={cn(
                'rounded-xl bg-overlay px-4 py-3 text-sm shadow-overlay flex items-start gap-2',
                t.type === 'success' && 'text-success',
                t.type === 'error' && 'text-danger',
                t.type === 'info' && 'text-foreground'
              )}
            >
              <span className="flex-1 min-w-0 break-words">{t.message}</span>
              {t.type === 'error' && devMode && t.capturedError && (
                <button
                  type="button"
                  onClick={() => setDetailsToast(t)}
                  className="flex items-center gap-1 shrink-0 rounded-md border border-current/30 bg-current/10 px-2 py-0.5 text-[11px] font-medium hover:bg-current/20 transition-colors"
                  title="Voir les détails (mode développeur)"
                >
                  <Bug className="h-3 w-3" />
                  Détails
                </button>
              )}
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Fermer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={!!detailsToast} onClose={() => setDetailsToast(null)} className="max-w-2xl">
        <DialogHeader
          onClose={() => setDetailsToast(null)}
          icon={<Bug className="h-5 w-5 text-danger" />}
        >
          <DialogTitle>Détails de l&apos;erreur</DialogTitle>
          <DialogDescription>Mode développeur — payload brut renvoyé par l&apos;API.</DialogDescription>
        </DialogHeader>
        {detailsToast?.capturedError && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1.5">
              <span className="font-medium text-muted-foreground">Status</span>
              <span className="font-mono text-foreground">{detailsToast.capturedError.status}</span>
              <span className="font-medium text-muted-foreground">Method</span>
              <span className="font-mono text-foreground">{detailsToast.capturedError.method}</span>
              <span className="font-medium text-muted-foreground">URL</span>
              <span className="font-mono text-foreground break-all">{detailsToast.capturedError.url}</span>
              <span className="font-medium text-muted-foreground">Toast</span>
              <span className="text-foreground">{detailsToast.message}</span>
            </div>
            <div className="rounded-lg bg-surface border border-border/40 p-3 max-h-[50vh] overflow-auto">
              <pre className="text-[11px] font-mono text-foreground whitespace-pre-wrap break-all">
                {JSON.stringify(detailsToast.capturedError.body, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={copyDetails}>
                Copier
              </Button>
              <Button size="sm" onClick={() => setDetailsToast(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </ToastContext.Provider>
  )
}
