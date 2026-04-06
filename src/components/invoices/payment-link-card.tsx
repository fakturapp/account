'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import {
  Link2,
  Copy,
  Check,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  Lock,
} from 'lucide-react'

interface PaymentLinkInfo {
  id: string
  isActive: boolean
  isExpired: boolean
  isPasswordProtected: boolean
  paidAt: string | null
  confirmedAt: string | null
  expiresAt: string | null
  url?: string | null
}

interface PaymentLinkCardProps {
  invoiceId: string
  invoiceStatus: string
  paymentLink: PaymentLinkInfo | null
  linkUrl: string | null
  onDeleted: () => void
  onConfirmClick: () => void
}

export function PaymentLinkCard({
  invoiceId,
  invoiceStatus,
  paymentLink,
  linkUrl,
  onDeleted,
  onConfirmClick,
}: PaymentLinkCardProps) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!paymentLink) return null

  async function handleDelete() {
    setDeleting(true)
    const { error } = await api.delete(`/invoices/${invoiceId}/payment-link`)
    setDeleting(false)
    if (error) {
      toast(error, 'error')
      return
    }
    toast('Lien de paiement supprimé', 'success')
    onDeleted()
  }

  async function handleCopy() {
    if (!linkUrl) return
    await navigator.clipboard.writeText(linkUrl)
    setCopied(true)
    toast('Lien copié', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  // paid_unconfirmed state: show confirmation card
  if (invoiceStatus === 'paid_unconfirmed') {
    return (
      <div className="px-5 py-4 border-b border-border">
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-500">Paiement non confirmé</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            Le client a indiqué avoir effectué le paiement. Vérifiez la réception sur votre compte
            bancaire.
          </p>
          <button
            onClick={onConfirmClick}
            className="px-3 py-1.5 rounded-full bg-card shadow-sm text-xs font-semibold text-amber-500 border border-border hover:bg-muted/50 transition-colors"
          >
            <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
            Confirmer le paiement
          </button>
        </div>
      </div>
    )
  }

  // Link confirmed / inactive
  if (paymentLink.confirmedAt || !paymentLink.isActive) {
    return null
  }

  // Expired link
  if (paymentLink.isExpired) {
    return (
      <div className="px-5 py-4 border-b border-border">
        <div className="rounded-lg bg-muted/30 border border-border p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Lien expiré</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Le lien de paiement a expiré. Supprimez-le pour en créer un nouveau.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="mt-2 px-3 py-1 rounded-full bg-card shadow-sm text-xs font-semibold text-red-400 border border-border hover:bg-muted/50 transition-colors disabled:opacity-40"
          >
            {deleting ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3 w-3 inline mr-1" />}
            Supprimer
          </button>
        </div>
      </div>
    )
  }

  // Active link: show info + copy + delete
  return (
    <div className="px-5 py-4 border-b border-border">
      <div className="rounded-lg bg-primary/5 border border-primary/15 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Lien de paiement actif</span>
          {paymentLink.isPasswordProtected && (
            <Lock className="h-3 w-3 text-muted-foreground ml-auto" title="Protégé par mot de passe" />
          )}
        </div>

        {linkUrl && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[11px] text-muted-foreground font-mono truncate flex-1">
              {linkUrl}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}

        {paymentLink.expiresAt && (
          <p className="text-[11px] text-muted-foreground mb-2">
            Expire le{' '}
            {new Date(paymentLink.expiresAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1 rounded-full bg-card shadow-sm text-xs font-semibold text-red-400 border border-border hover:bg-muted/50 transition-colors disabled:opacity-40"
        >
          {deleting ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3 w-3 inline mr-1" />}
          Supprimer le lien
        </button>
      </div>
    </div>
  )
}
