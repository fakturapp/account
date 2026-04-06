'use client'

import { useState } from 'react'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import {
  Link2,
  Copy,
  Check,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Send,
  Banknote,
  Coins,
  Clock,
} from 'lucide-react'

interface PaymentLinkModalProps {
  open: boolean
  onClose: () => void
  invoiceId: string
  invoiceNumber: string
  invoicePaymentMethod: string | null
  invoiceDueDate: string | null
  onCreated: (link: { id: string; token: string; url: string; expiresAt: string | null }) => void
}

export function PaymentLinkModal({
  open,
  onClose,
  invoiceId,
  invoiceNumber,
  invoicePaymentMethod,
  invoiceDueDate,
  onCreated,
}: PaymentLinkModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Step 1
  const [paymentMethod, setPaymentMethod] = useState(invoicePaymentMethod || 'bank_transfer')
  const [paymentType, setPaymentType] = useState<'full' | 'installments'>('full')

  // Step 2
  const [showIban, setShowIban] = useState(true)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [expirationType, setExpirationType] = useState<'due_date' | 'custom' | 'days'>('due_date')
  const [expiresAt, setExpiresAt] = useState('')
  const [expirationDays, setExpirationDays] = useState(30)

  // Step 3
  const [generatedLink, setGeneratedLink] = useState<{
    id: string
    token: string
    url: string
    expiresAt: string | null
  } | null>(null)

  const isCash = paymentMethod === 'cash' || paymentMethod === 'especes'

  function handleClose() {
    setStep(1)
    setPaymentMethod(invoicePaymentMethod || 'bank_transfer')
    setPaymentType('full')
    setShowIban(true)
    setPassword('')
    setExpirationType('due_date')
    setExpiresAt('')
    setExpirationDays(30)
    setGeneratedLink(null)
    setCopied(false)
    onClose()
  }

  async function handleGenerate() {
    setLoading(true)

    const body: Record<string, any> = {
      paymentMethod: 'bank_transfer',
      paymentType: 'full',
      showIban,
      expirationType,
    }

    if (password) body.password = password
    if (expirationType === 'custom' && expiresAt) body.expiresAt = expiresAt
    if (expirationType === 'days') body.expirationDays = expirationDays

    const { data, error } = await api.post<{
      paymentLink: { id: string; token: string; url: string; expiresAt: string | null }
    }>(`/invoices/${invoiceId}/payment-link`, body)

    setLoading(false)

    if (error) {
      toast(error, 'error')
      return
    }

    if (data?.paymentLink) {
      setGeneratedLink(data.paymentLink)
      onCreated(data.paymentLink)
      setStep(3)
    }
  }

  async function handleCopy() {
    if (!generatedLink) return
    await navigator.clipboard.writeText(generatedLink.url)
    setCopied(true)
    toast('Lien copié', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-lg">
      {/* Step 1: Payment method & type */}
      {step === 1 && (
        <>
          <DialogTitle>Lien de paiement</DialogTitle>
          <DialogDescription>
            Configurez le lien de paiement pour la facture {invoiceNumber}
          </DialogDescription>

          <div className="mt-5 space-y-4">
            {/* Payment method */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Mode de paiement
              </label>
              <div className="space-y-2">
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={() => setPaymentMethod('bank_transfer')}
                    className="sr-only"
                  />
                  <Banknote className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">Virement bancaire</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border opacity-40 cursor-not-allowed">
                  <Coins className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Espèces</span>
                  <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </label>
              </div>
            </div>

            {isCash && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-400">
                    Impossible de créer un lien de paiement avec le mode espèces.
                  </p>
                </div>
              </div>
            )}

            {/* Payment type */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Type de paiement
              </label>
              <div className="space-y-2">
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    paymentType === 'full'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="full"
                    checked={paymentType === 'full'}
                    onChange={() => setPaymentType('full')}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-foreground">Montant total</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border opacity-40 cursor-not-allowed">
                  <span className="text-sm font-medium text-muted-foreground">
                    Paiement en plusieurs fois
                  </span>
                  <span className="ml-auto text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                    Bientôt
                  </span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleClose}>
              Annuler
            </Button>
            <Button size="sm" disabled={isCash} onClick={() => setStep(2)}>
              Suivant <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </DialogFooter>
        </>
      )}

      {/* Step 2: Parameters */}
      {step === 2 && (
        <>
          <DialogTitle>Paramètres du lien</DialogTitle>
          <DialogDescription>Configurez les options de sécurité et d&apos;expiration</DialogDescription>

          <div className="mt-5 space-y-5">
            {/* Show IBAN toggle */}
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Afficher l&apos;IBAN au client
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowIban(!showIban)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  showIban ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    showIban ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Mot de passe (optionnel)
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Laisser vide pour un lien public"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Expiration */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Expiration
              </label>
              <div className="space-y-2">
                {invoiceDueDate && (
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      expirationType === 'due_date'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="expiration"
                      value="due_date"
                      checked={expirationType === 'due_date'}
                      onChange={() => setExpirationType('due_date')}
                      className="sr-only"
                    />
                    <span className="text-sm text-foreground">
                      Date d&apos;échéance ({invoiceDueDate})
                    </span>
                  </label>
                )}
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    expirationType === 'days'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="expiration"
                    value="days"
                    checked={expirationType === 'days'}
                    onChange={() => setExpirationType('days')}
                    className="sr-only"
                  />
                  <span className="text-sm text-foreground">Dans</span>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(Number(e.target.value))}
                    className="w-20 h-8 text-center"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpirationType('days')
                    }}
                  />
                  <span className="text-sm text-foreground">jours</span>
                </label>
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    expirationType === 'custom'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="expiration"
                    value="custom"
                    checked={expirationType === 'custom'}
                    onChange={() => setExpirationType('custom')}
                    className="sr-only"
                  />
                  <span className="text-sm text-foreground">Date personnalisée</span>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-40 h-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpirationType('custom')
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Retour
            </Button>
            <Button size="sm" disabled={loading} onClick={handleGenerate}>
              {loading ? <Spinner className="h-4 w-4" /> : <Link2 className="h-3.5 w-3.5 mr-1" />}
              Générer le lien
            </Button>
          </DialogFooter>
        </>
      )}

      {/* Step 3: Link generated */}
      {step === 3 && generatedLink && (
        <>
          <DialogTitle>Lien de paiement créé</DialogTitle>
          <DialogDescription>
            Partagez ce lien avec votre client pour qu&apos;il puisse effectuer le paiement.
          </DialogDescription>

          <div className="mt-5 space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={generatedLink.url}
                className="flex-1 text-xs font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {generatedLink.expiresAt && (
              <p className="text-xs text-muted-foreground">
                Expire le{' '}
                {new Date(generatedLink.expiresAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleClose}>
              Fermer
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  )
}
