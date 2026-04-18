'use client'

import { useEffect, useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RecoveryKeyDisplay } from '@/components/shared/recovery-key-display'

interface RecoveryKeyModalProps {
  open: boolean
  recoveryKey: string
  onClose: () => void
  title?: string
  description?: string
  minVisibleSeconds?: number
}

export function RecoveryKeyModal({
  open,
  recoveryKey,
  onClose,
  title = 'Nouvelle clef de secours',
  description = 'Une nouvelle clef de secours a été générée pour votre compte. Elle remplace la précédente pour toutes vos équipes actives.',
  minVisibleSeconds = 10,
}: RecoveryKeyModalProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(minVisibleSeconds)

  useEffect(() => {
    if (!open) {
      setRemainingSeconds(minVisibleSeconds)
      return
    }

    setRemainingSeconds(minVisibleSeconds)

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [open, recoveryKey, minVisibleSeconds])

  const canClose = remainingSeconds === 0

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (canClose) onClose()
      }}
      dismissible={canClose}
      className="max-w-xl"
    >
      <DialogHeader
        icon={<KeyRound className="h-5 w-5 text-accent" />}
        onClose={canClose ? onClose : undefined}
        showClose={canClose}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <RecoveryKeyDisplay recoveryKey={recoveryKey} />

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {canClose
            ? 'Vous pouvez maintenant fermer cette fenêtre.'
            : `Cette fenêtre restera ouverte encore ${remainingSeconds}s pour vous laisser le temps de noter la clef.`}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" onClick={onClose} disabled={!canClose} className="w-full">
          {canClose ? "J'ai noté la clef" : `Disponible dans ${remainingSeconds}s`}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
