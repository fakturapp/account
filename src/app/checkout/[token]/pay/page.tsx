'use client'

import { useState, useEffect, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Banknote,
  Lock,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  CreditCard,
  Eye,
} from 'lucide-react'

type CheckoutState =
  | 'loading'
  | 'error'
  | 'expired'
  | 'password'
  | 'payment_method'
  | 'iban_view'
  | 'confirm_pay'
  | 'paid_pending'
  | 'confirmed'

interface CheckoutData {
  status: 'active' | 'paid_pending' | 'confirmed'
  invoiceNumber: string
  amount: number
  currency: string
  paymentMethod?: string
  isPasswordProtected?: boolean
  showIban?: boolean
}

interface IbanData {
  iban: string | null
  ibanRaw: string | null
  bic: string | null
  bankName: string | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || ''

function getApiUrl(path: string) {
  return `${API_URL}${API_PREFIX}${path}`
}

export default function CheckoutPayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [state, setState] = useState<CheckoutState>('loading')
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [ibanData, setIbanData] = useState<IbanData | null>(null)
  const [password, setPassword] = useState('')
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Load checkout data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(getApiUrl(`/checkout/${token}`))
        if (res.status === 404) {
          setErrorMessage('Ce lien de paiement est introuvable.')
          setState('error')
          return
        }
        if (res.status === 410) {
          setState('expired')
          return
        }
        if (!res.ok) {
          setErrorMessage('Une erreur est survenue.')
          setState('error')
          return
        }

        const data: CheckoutData = await res.json()
        setCheckoutData(data)

        if (data.status === 'confirmed') {
          setState('confirmed')
        } else if (data.status === 'paid_pending') {
          setState('paid_pending')
        } else if (data.isPasswordProtected) {
          setState('password')
        } else {
          setState('payment_method')
        }
      } catch {
        setErrorMessage('Impossible de charger les informations de paiement.')
        setState('error')
      }
    }
    load()
  }, [token])

  async function handlePasswordSubmit() {
    setLoading(true)
    setPasswordError('')

    try {
      const res = await fetch(getApiUrl(`/checkout/${token}/verify-password`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.status === 401) {
        setPasswordError('Mot de passe incorrect')
        setLoading(false)
        return
      }
      if (res.status === 429) {
        setPasswordError('Trop de tentatives. Réessayez plus tard.')
        setLoading(false)
        return
      }
      if (!res.ok) {
        setPasswordError('Une erreur est survenue')
        setLoading(false)
        return
      }

      const data = await res.json()
      setSessionToken(data.sessionToken)
      setState('payment_method')
    } catch {
      setPasswordError('Erreur de connexion')
    }
    setLoading(false)
  }

  async function handleSelectBankTransfer() {
    if (!checkoutData?.showIban) {
      setState('iban_view')
      return
    }

    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (sessionToken) {
        headers['X-Checkout-Session'] = sessionToken
      }

      const res = await fetch(getApiUrl(`/checkout/${token}/iban`), { headers })

      if (!res.ok) {
        setErrorMessage('Impossible de charger les informations bancaires.')
        setState('error')
        setLoading(false)
        return
      }

      const data: IbanData = await res.json()
      setIbanData(data)
      setState('iban_view')
    } catch {
      setErrorMessage('Erreur de connexion')
      setState('error')
    }
    setLoading(false)
  }

  async function handleMarkPaid() {
    setLoading(true)
    try {
      const res = await fetch(getApiUrl(`/checkout/${token}/mark-paid`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.status === 409) {
        setState('paid_pending')
        setLoading(false)
        return
      }
      if (!res.ok) {
        setErrorMessage('Une erreur est survenue')
        setState('error')
        setLoading(false)
        return
      }

      setState('paid_pending')
    } catch {
      setErrorMessage('Erreur de connexion')
      setState('error')
    }
    setLoading(false)
  }

  async function handleDownloadPdf() {
    setDownloading(true)
    try {
      const res = await fetch(getApiUrl(`/checkout/${token}/pdf`))
      if (!res.ok) {
        setDownloading(false)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${checkoutData?.invoiceNumber || 'facture'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Silently fail
    }
    setDownloading(false)
  }

  async function handleCopyIban() {
    if (!ibanData?.ibanRaw) return
    await navigator.clipboard.writeText(ibanData.ibanRaw)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formattedAmount = checkoutData
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: checkoutData.currency }).format(checkoutData.amount)
    : ''

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {/* Loading */}
        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-zinc-400">Chargement...</p>
          </motion.div>
        )}

        {/* Error */}
        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-red-500/20 bg-[#141118] p-8 text-center"
          >
            <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Erreur</h2>
            <p className="text-sm text-zinc-400">{errorMessage}</p>
          </motion.div>
        )}

        {/* Expired */}
        {state === 'expired' && (
          <motion.div
            key="expired"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-500/20 bg-[#141118] p-8 text-center"
          >
            <Clock className="h-10 w-10 text-amber-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Lien expiré</h2>
            <p className="text-sm text-zinc-400">Ce lien de paiement a expiré. Contactez l&apos;émetteur de la facture pour obtenir un nouveau lien.</p>
          </motion.div>
        )}

        {/* Password */}
        {state === 'password' && (
          <motion.div
            key="password"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-zinc-800 bg-[#141118] p-8"
          >
            <div className="text-center mb-6">
              <Lock className="h-10 w-10 text-indigo-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white">Lien protégé</h2>
              <p className="text-sm text-zinc-400 mt-1">Entrez le mot de passe pour accéder au paiement.</p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Mot de passe"
                className="w-full h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-indigo-500 transition-colors"
              />
              {passwordError && (
                <p className="text-sm text-red-400">{passwordError}</p>
              )}
              <button
                onClick={handlePasswordSubmit}
                disabled={loading || !password}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Accéder'
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Payment method selection */}
        {state === 'payment_method' && checkoutData && (
          <motion.div
            key="method"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-zinc-800 bg-[#141118] p-8"
          >
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-white">Paiement de la facture</h2>
              <p className="text-2xl font-bold text-white mt-2">{formattedAmount}</p>
              <p className="text-sm text-zinc-400 mt-1">Facture {checkoutData.invoiceNumber}</p>
            </div>

            <p className="text-sm font-medium text-zinc-300 mb-3">Mode de paiement</p>

            <div className="space-y-2">
              <button
                onClick={handleSelectBankTransfer}
                disabled={loading}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-zinc-700 hover:border-indigo-500 bg-zinc-900/50 hover:bg-indigo-500/5 transition-all text-left"
              >
                <Banknote className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Virement bancaire</p>
                  <p className="text-xs text-zinc-400">Effectuez un virement vers le compte indiqué</p>
                </div>
              </button>

              {/* Stripe placeholder */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800 opacity-40 cursor-not-allowed">
                <CreditCard className="h-5 w-5 text-zinc-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-500">Carte bancaire</p>
                  <p className="text-xs text-zinc-600">Bientôt disponible</p>
                </div>
                <Lock className="h-3.5 w-3.5 text-zinc-600" />
              </div>
            </div>

            {/* Download button */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="mt-6 w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Téléchargement...' : 'Télécharger la facture'}
            </button>
          </motion.div>
        )}

        {/* IBAN view */}
        {state === 'iban_view' && checkoutData && (
          <motion.div
            key="iban"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-zinc-800 bg-[#141118] p-8"
          >
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-white">Virement bancaire</h2>
              <p className="text-2xl font-bold text-white mt-2">{formattedAmount}</p>
              <p className="text-sm text-zinc-400 mt-1">Facture {checkoutData.invoiceNumber}</p>
            </div>

            {ibanData?.iban && (
              <div className="space-y-4">
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                      Informations bancaires
                    </span>
                  </div>

                  {ibanData.bankName && (
                    <div className="mb-3">
                      <p className="text-xs text-zinc-500 mb-0.5">Banque</p>
                      <p className="text-sm font-medium text-white">{ibanData.bankName}</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="text-xs text-zinc-500 mb-0.5">IBAN</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono font-medium text-white tracking-wider">
                        {ibanData.iban}
                      </p>
                      <button
                        onClick={handleCopyIban}
                        className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {ibanData.bic && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">BIC</p>
                      <p className="text-sm font-mono font-medium text-white">{ibanData.bic}</p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/15 p-3">
                  <p className="text-xs text-indigo-300 leading-relaxed">
                    Effectuez un virement du montant indiqué vers ce compte. Indiquez le numéro de facture <strong>{checkoutData.invoiceNumber}</strong> en référence du virement.
                  </p>
                </div>
              </div>
            )}

            {!ibanData?.iban && (
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
                <p className="text-sm text-zinc-400">
                  Contactez l&apos;émetteur de la facture pour obtenir les coordonnées bancaires.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setState('payment_method')}
                className="flex-1 h-11 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setState('confirm_pay')}
                className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors"
              >
                J&apos;ai payé
              </button>
            </div>

            {/* Download */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="mt-3 w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Téléchargement...' : 'Télécharger la facture'}
            </button>
          </motion.div>
        )}

        {/* Confirm payment dialog */}
        {state === 'confirm_pay' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-zinc-800 bg-[#141118] p-8"
          >
            <div className="text-center mb-6">
              <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white">Confirmer le paiement</h2>
            </div>

            <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3 mb-6">
              <p className="text-xs text-amber-300 leading-relaxed">
                En confirmant, vous ne pourrez plus revenir en arrière ni voir les informations bancaires.
                Le statut de la facture sera mis à jour auprès de l&apos;émetteur.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setState('iban_view')}
                className="flex-1 h-11 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors disabled:opacity-40"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Paid pending */}
        {state === 'paid_pending' && checkoutData && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-zinc-800 bg-[#141118] p-8 text-center"
          >
            <Clock className="h-10 w-10 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Paiement envoyé</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Votre paiement pour la facture <strong className="text-white">{checkoutData.invoiceNumber}</strong> a été signalé.
              Il est en attente de confirmation par l&apos;émetteur.
            </p>

            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Téléchargement...' : 'Télécharger la facture'}
            </button>
          </motion.div>
        )}

        {/* Confirmed */}
        {state === 'confirmed' && checkoutData && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-green-500/20 bg-[#141118] p-8 text-center"
          >
            <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Paiement confirmé</h2>
            <p className="text-sm text-zinc-400">
              Le paiement de la facture <strong className="text-white">{checkoutData.invoiceNumber}</strong> a été confirmé.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
