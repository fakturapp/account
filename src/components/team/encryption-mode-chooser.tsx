'use client'

import { useState } from 'react'
import { Cloud, Lock, AlertTriangle } from 'lucide-react'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  CheckboxRoot,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxContent,
} from '@/components/ui/checkbox'

export type EncryptionMode = 'private' | 'standard'

export interface EncryptionAcks {
  dataLoss: boolean
  notResponsible: boolean
}

interface Props {
  value: EncryptionMode
  onChange: (mode: EncryptionMode) => void
  acks: EncryptionAcks
  onAcksChange: (acks: EncryptionAcks) => void
}

export function EncryptionModeChooser({ value, onChange, acks, onAcksChange }: Props) {
  const [warnOpen, setWarnOpen] = useState(false)
  const [pendingAcks, setPendingAcks] = useState<EncryptionAcks>(acks)

  function openPrivateConfirm() {
    setPendingAcks(acks)
    setWarnOpen(true)
  }

  function confirmPrivate() {
    if (!pendingAcks.dataLoss || !pendingAcks.notResponsible) return
    onAcksChange(pendingAcks)
    onChange('private')
    setWarnOpen(false)
  }

  function cancelPrivate() {
    setWarnOpen(false)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Chiffrement de l&apos;équipe
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange('standard')}
          className={`flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
            value === 'standard'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              value === 'standard' ? 'bg-primary/20' : 'bg-surface-hover'
            }`}
          >
            <Cloud
              className={`h-5 w-5 ${value === 'standard' ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Mode Standard</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Vos données sont chiffrées sur nos serveurs. Aucun mot de passe supplémentaire, aucun
              verrouillage. Les administrateurs Faktur peuvent techniquement accéder à vos données.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={openPrivateConfirm}
          className={`flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
            value === 'private'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              value === 'private' ? 'bg-primary/20' : 'bg-surface-hover'
            }`}
          >
            <Lock
              className={`h-5 w-5 ${value === 'private' ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Mode Privé</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Chiffrement de bout en bout avec votre mot de passe. Seuls vous (et votre clef de
              secours) pouvez déchiffrer vos données. Si vous perdez les deux, c&apos;est perdu.
            </p>
          </div>
        </button>
      </div>

      <Dialog open={warnOpen} onClose={cancelPrivate}>
        <DialogHeader
          onClose={cancelPrivate}
          icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
        >
          <DialogTitle>Activer le Mode Privé</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Vos données seront chiffrées de bout en bout. Pour les déchiffrer, vous aurez besoin :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>de votre mot de passe Faktur,</li>
            <li>ou de votre clef de secours (à conserver précieusement, hors du site).</li>
          </ul>

          <div className="space-y-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
            <CheckboxRoot
              isSelected={pendingAcks.dataLoss}
              onChange={(checked) => setPendingAcks((p) => ({ ...p, dataLoss: !!checked }))}
              className="flex items-start gap-3 cursor-pointer"
            >
              <CheckboxControl className="mt-0.5">
                <CheckboxIndicator />
              </CheckboxControl>
              <CheckboxContent className="text-sm text-foreground leading-tight">
                Je comprends que si je perds mon mot de passe ET ma clef de secours, mes données
                seront définitivement perdues.
              </CheckboxContent>
            </CheckboxRoot>

            <CheckboxRoot
              isSelected={pendingAcks.notResponsible}
              onChange={(checked) =>
                setPendingAcks((p) => ({ ...p, notResponsible: !!checked }))
              }
              className="flex items-start gap-3 cursor-pointer"
            >
              <CheckboxControl className="mt-0.5">
                <CheckboxIndicator />
              </CheckboxControl>
              <CheckboxContent className="text-sm text-foreground leading-tight">
                Je comprends que Faktur ne peut être tenu responsable d&apos;une perte de données
                causée par un déploiement ou une mise à jour défectueuse.
              </CheckboxContent>
            </CheckboxRoot>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={cancelPrivate}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={confirmPrivate}
            disabled={!pendingAcks.dataLoss || !pendingAcks.notResponsible}
          >
            Activer le Mode Privé
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
