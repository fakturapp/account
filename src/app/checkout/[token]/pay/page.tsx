'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
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
  Shield,
  ArrowLeft,
  Loader2,
} from 'lucide-react'

type CheckoutStep = 'loading' | 'error' | 'expired' | 'password' | 'method' | 'iban' | 'confirm' | 'pending' | 'done'

interface CheckoutData {
  status: 'active' | 'paid_pending' | 'confirmed'
  invoiceNumber: string
  amount: number
  currency: string
  paymentMethod?: string
  isPasswordProtected?: boolean
  showIban?: boolean
  companyName?: string | null
  hasPdf?: boolean
}

interface IbanData {
  iban: string | null
  ibanRaw: string | null
  bic: string | null
  bankName: string | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || ''
function apiUrl(path: string) { return `${API_URL}${API_PREFIX}${path}` }

const fadeSlide = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
}

/* ── Step indicator (onboarding-style) ── */
const stepLabels = ['Méthode', 'Détails', 'Confirmation']

function StepBar({ current }: { current: number }) {
  if (current < 0 || current > 2) return null
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 mb-6">
      {stepLabels.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center gap-3">
            {i > 0 && <div className={`h-px w-8 transition-colors duration-300 ${done ? 'bg-indigo-500' : 'bg-zinc-700'}`} />}
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300 ${
                done ? 'bg-green-500/20 text-green-400' : active ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {done ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:inline transition-colors ${active ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}

/* ── Spinner ── */
function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />
}

/* ── Main ── */
export default function CheckoutPayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [step, setStep] = useState<CheckoutStep>('loading')
  const [data, setData] = useState<CheckoutData | null>(null)
  const [iban, setIban] = useState<IbanData | null>(null)
  const [pw, setPw] = useState('')
  const [session, setSession] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dling, setDling] = useState(false)

  const boom = useCallback(() => {
    const end = Date.now() + 2000
    const go = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#6366f1', '#818cf8', '#a78bfa', '#4ade80', '#fbbf24'] })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#6366f1', '#818cf8', '#a78bfa', '#4ade80', '#fbbf24'] })
      if (Date.now() < end) requestAnimationFrame(go)
    }
    go()
  }, [])

  /* Load */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(apiUrl(`/checkout/${token}`))
        if (r.status === 404) { setErrMsg('Ce lien de paiement est introuvable.'); setStep('error'); return }
        if (r.status === 410) { setStep('expired'); return }
        if (!r.ok) { setErrMsg('Une erreur est survenue.'); setStep('error'); return }
        const d: CheckoutData = await r.json()
        setData(d)
        if (d.status === 'confirmed') { setStep('done'); setTimeout(boom, 300) }
        else if (d.status === 'paid_pending') setStep('pending')
        else if (d.isPasswordProtected) setStep('password')
        else setStep('method')
      } catch { setErrMsg('Impossible de charger les informations.'); setStep('error') }
    })()
  }, [token, boom])

  async function submitPw() {
    if (!pw) return
    setBusy(true); setPwErr('')
    try {
      const r = await fetch(apiUrl(`/checkout/${token}/verify-password`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
      if (r.status === 401) { setPwErr('Mot de passe incorrect'); setBusy(false); return }
      if (r.status === 429) { setPwErr('Trop de tentatives. Réessayez plus tard.'); setBusy(false); return }
      if (!r.ok) { setPwErr('Erreur'); setBusy(false); return }
      const d = await r.json()
      setSession(d.sessionToken)
      setStep('method')
    } catch { setPwErr('Erreur de connexion') }
    setBusy(false)
  }

  async function selectBank() {
    if (!data?.showIban) { setStep('iban'); return }
    setBusy(true)
    try {
      const h: Record<string, string> = {}
      if (session) h['X-Checkout-Session'] = session
      const r = await fetch(apiUrl(`/checkout/${token}/iban`), { headers: h })
      if (!r.ok) { const e = await r.json().catch(() => null); setErrMsg(e?.message || 'Erreur'); setStep('error'); setBusy(false); return }
      setIban(await r.json())
      setStep('iban')
    } catch { setErrMsg('Erreur de connexion'); setStep('error') }
    setBusy(false)
  }

  async function markPaid() {
    setBusy(true)
    try {
      const r = await fetch(apiUrl(`/checkout/${token}/mark-paid`), { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      if (r.status === 409) { setStep('pending'); setBusy(false); return }
      if (!r.ok) { setErrMsg('Erreur'); setStep('error'); setBusy(false); return }
      setStep('pending'); boom()
    } catch { setErrMsg('Erreur de connexion'); setStep('error') }
    setBusy(false)
  }

  async function dlPdf() {
    setDling(true)
    try {
      const r = await fetch(apiUrl(`/checkout/${token}/pdf`))
      if (r.ok) {
        const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a')
        a.href = u; a.download = `${data?.invoiceNumber || 'facture'}.pdf`; a.click(); URL.revokeObjectURL(u)
      }
    } catch { /* silent */ }
    setDling(false)
  }

  function copyIban() {
    if (!iban?.ibanRaw) return
    navigator.clipboard.writeText(iban.ibanRaw)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const amt = data ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: data.currency }).format(data.amount) : ''

  /* Which onboarding step to show */
  const stepIdx = step === 'method' ? 0 : step === 'iban' ? 1 : step === 'confirm' ? 2 : -1

  function DlBtn() {
    if (!data?.hasPdf) return null
    return (
      <button onClick={dlPdf} disabled={dling} className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-zinc-700/50 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/30 transition-all disabled:opacity-40">
        {dling ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {dling ? 'Téléchargement...' : 'Télécharger la facture'}
      </button>
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Step bar */}
      {stepIdx >= 0 && <StepBar current={stepIdx} />}

      <AnimatePresence mode="wait">

        {/* Loading */}
        {step === 'loading' && (
          <motion.div key="l" {...fadeSlide} className="flex flex-col items-center py-24">
            <Spinner className="h-8 w-8 text-indigo-400" />
            <p className="mt-4 text-sm text-zinc-500">Chargement...</p>
          </motion.div>
        )}

        {/* Error */}
        {step === 'error' && (
          <motion.div key="e" {...fadeSlide} className="rounded-2xl border border-red-500/15 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5"><AlertTriangle className="h-7 w-7 text-red-400" /></div>
              <h2 className="text-lg font-semibold text-white mb-2">Erreur</h2>
              <p className="text-sm text-zinc-400">{errMsg}</p>
            </div>
          </motion.div>
        )}

        {/* Expired */}
        {step === 'expired' && (
          <motion.div key="x" {...fadeSlide} className="rounded-2xl border border-amber-500/15 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5"><Clock className="h-7 w-7 text-amber-400" /></div>
              <h2 className="text-lg font-semibold text-white mb-2">Lien expiré</h2>
              <p className="text-sm text-zinc-400">Contactez l&apos;émetteur pour un nouveau lien.</p>
            </div>
          </motion.div>
        )}

        {/* Password */}
        {step === 'password' && (
          <motion.div key="p" {...fadeSlide} className="rounded-2xl border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5"><Lock className="h-7 w-7 text-indigo-400" /></div>
              <h2 className="text-lg font-semibold text-white">Accès protégé</h2>
              <p className="text-sm text-zinc-400 mt-1">Entrez le mot de passe pour continuer</p>
            </div>
            <div className="space-y-3">
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitPw()} placeholder="Mot de passe" autoFocus
                className="w-full h-11 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all" />
              {pwErr && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> {pwErr}</motion.p>}
              <button onClick={submitPw} disabled={busy || !pw}
                className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-40 shadow-md shadow-indigo-500/20">
                {busy ? <Spinner className="h-4 w-4 mx-auto" /> : 'Accéder'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Method */}
        {step === 'method' && data && (
          <motion.div key="m" {...fadeSlide} className="rounded-2xl border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              {data.companyName && <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-3">{data.companyName}</p>}
              <motion.p initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="text-3xl font-bold text-white tracking-tight">{amt}</motion.p>
              <p className="text-sm text-zinc-500 mt-1">Facture {data.invoiceNumber}</p>
            </div>

            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Mode de paiement</p>

            <button onClick={selectBank} disabled={busy}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-700/50 bg-zinc-800/30 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all text-left group mb-2">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0"><Banknote className="h-5 w-5 text-indigo-400" /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Virement bancaire</p>
                <p className="text-xs text-zinc-500 mt-0.5">Coordonnées bancaires fournies</p>
              </div>
              {busy ? <Spinner className="h-4 w-4 text-indigo-400" /> : <ArrowLeft className="h-4 w-4 text-zinc-600 rotate-180" />}
            </button>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800/50 opacity-30 cursor-not-allowed mb-6">
              <div className="h-10 w-10 rounded-lg bg-zinc-800/50 flex items-center justify-center shrink-0"><CreditCard className="h-5 w-5 text-zinc-600" /></div>
              <div className="flex-1"><p className="text-sm text-zinc-500">Carte bancaire</p><p className="text-[11px] text-zinc-600">Bientôt disponible</p></div>
              <Lock className="h-3.5 w-3.5 text-zinc-700" />
            </div>

            <DlBtn />

            <div className="mt-5 flex items-center justify-center gap-1.5 text-zinc-600">
              <Shield className="h-3 w-3" /><span className="text-[11px]">Paiement sécurisé et chiffré</span>
            </div>
          </motion.div>
        )}

        {/* IBAN */}
        {step === 'iban' && data && (
          <motion.div key="i" {...fadeSlide} className="rounded-2xl border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-white">Virement bancaire</h2>
              <p className="text-2xl font-bold text-white mt-1">{amt}</p>
              <p className="text-sm text-zinc-500 mt-0.5">Facture {data.invoiceNumber}</p>
            </div>

            {iban?.iban ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
                <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-4 w-4 text-indigo-400" /><span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Coordonnées bancaires</span>
                  </div>
                  {iban.bankName && <div className="mb-4"><p className="text-[11px] text-zinc-600 uppercase tracking-wider mb-1">Banque</p><p className="text-sm font-medium text-white">{iban.bankName}</p></div>}
                  <div className="mb-4">
                    <p className="text-[11px] text-zinc-600 uppercase tracking-wider mb-1">IBAN</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-mono font-semibold text-white tracking-[0.15em] break-all">{iban.iban}</p>
                      <button onClick={copyIban} className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all" title="Copier">
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {iban.bic && <div><p className="text-[11px] text-zinc-600 uppercase tracking-wider mb-1">BIC</p><p className="text-sm font-mono font-medium text-white tracking-wider">{iban.bic}</p></div>}
                </div>

                <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-3.5">
                  <p className="text-xs text-indigo-300/80 leading-relaxed">Indiquez <strong className="text-indigo-200">{data.invoiceNumber}</strong> en référence du virement.</p>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-5 text-center">
                <p className="text-sm text-zinc-400">Contactez l&apos;émetteur pour les coordonnées bancaires.</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('method')} className="flex-1 h-10 rounded-lg border border-zinc-700/50 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition-all flex items-center justify-center gap-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Retour
              </button>
              <button onClick={() => setStep('confirm')} className="flex-1 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-all shadow-md shadow-indigo-500/20">
                J&apos;ai payé
              </button>
            </div>
            <div className="mt-3"><DlBtn /></div>
          </motion.div>
        )}

        {/* Confirm */}
        {step === 'confirm' && (
          <motion.div key="c" {...fadeSlide} className="rounded-2xl border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5"><AlertTriangle className="h-7 w-7 text-amber-400" /></div>
              <h2 className="text-lg font-semibold text-white">Confirmer le paiement</h2>
            </div>
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4 mb-6">
              <p className="text-xs text-amber-300/80 leading-relaxed text-center">
                En confirmant, vous ne pourrez plus consulter les informations bancaires. Le statut sera mis à jour.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('iban')} className="flex-1 h-10 rounded-lg border border-zinc-700/50 text-sm font-medium text-zinc-400 hover:text-white transition-all">Annuler</button>
              <button onClick={markPaid} disabled={busy} className="flex-1 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-all disabled:opacity-40 shadow-md shadow-indigo-500/20">
                {busy ? <Spinner className="h-4 w-4 mx-auto" /> : 'Confirmer'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Pending */}
        {step === 'pending' && data && (
          <motion.div key="w" {...fadeSlide} className="rounded-2xl border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5"><Clock className="h-7 w-7 text-indigo-400" /></motion.div>
              <h2 className="text-lg font-semibold text-white mb-2">Paiement envoyé</h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Facture <strong className="text-white">{data.invoiceNumber}</strong> — en attente de confirmation.
              </p>
              <DlBtn />
            </div>
          </motion.div>
        )}

        {/* Done */}
        {step === 'done' && data && (
          <motion.div key="d" {...fadeSlide} className="rounded-2xl border border-green-500/15 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-5"><CheckCircle className="h-7 w-7 text-green-400" /></motion.div>
              <h2 className="text-lg font-semibold text-white mb-2">Paiement confirmé</h2>
              <p className="text-sm text-zinc-400">Facture <strong className="text-white">{data.invoiceNumber}</strong> — tout est en ordre.</p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
