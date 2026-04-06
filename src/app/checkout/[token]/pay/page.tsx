'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import confetti from 'canvas-confetti'

type Step = 'loading' | 'error' | 'expired' | 'password' | 'method' | 'iban' | 'confirm' | 'pending' | 'done'

interface Data {
  status: 'active' | 'paid_pending' | 'confirmed'
  invoiceNumber: string
  amount: number
  currency: string
  paymentMethod?: string
  isPasswordProtected?: boolean
  showIban?: boolean
  companyName?: string | null
  maskedEmail?: string | null
  hasPdf?: boolean
}

interface Iban {
  iban: string | null
  ibanRaw: string | null
  bic: string | null
  bankName: string | null
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
const PFX = process.env.NEXT_PUBLIC_API_PREFIX || ''
const api = (p: string) => `${API}${PFX}${p}`

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

export default function CheckoutPayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter() // ou utiliser `usePathname` si tu préfères
  const [step, setStep] = useState<Step>('loading')
  const [d, setD] = useState<Data | null>(null)
  const [ib, setIb] = useState<Iban | null>(null)
  const [pw, setPw] = useState('')
  const [sess, setSess] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dling, setDling] = useState(false)

  const boom = useCallback(() => {
    const end = Date.now() + 2500
    const go = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.65 },
        colors: ['#6366f1', '#818cf8', '#a78bfa', '#34d399', '#fbbf24'],
        gravity: 0.8,
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.65 },
        colors: ['#6366f1', '#818cf8', '#a78bfa', '#34d399', '#fbbf24'],
        gravity: 0.8,
      })
      if (Date.now() < end) requestAnimationFrame(go)
    }
    go()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(api(`/checkout/${token}`))
        if (r.status === 404) {
          setErr('Ce lien de paiement est introuvable ou a été supprimé.')
          setStep('error')
          return
        }
        if (r.status === 410) {
          setStep('expired')
          return
        }
        if (!r.ok) {
          setErr('Une erreur est survenue.')
          setStep('error')
          return
        }
        const data: Data = await r.json()
        setD(data)
        if (data.status === 'confirmed') {
          setStep('done')
          setTimeout(boom, 400)
        } else if (data.status === 'paid_pending') {
          setStep('pending')
        } else if (data.isPasswordProtected) {
          setStep('password')
        } else {
          setStep('method')
        }
      } catch {
        setErr('Impossible de contacter le serveur.')
        setStep('error')
      }
    })()
  }, [token, boom])

  async function submitPw() {
    if (!pw) return
    setBusy(true)
    setPwErr('')
    try {
      const r = await fetch(api(`/checkout/${token}/verify-password`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (r.status === 401) {
        setPwErr('Mot de passe incorrect')
        setBusy(false)
        return
      }
      if (r.status === 429) {
        setPwErr('Trop de tentatives. Réessayez dans quelques minutes.')
        setBusy(false)
        return
      }
      if (!r.ok) {
        setPwErr('Erreur')
        setBusy(false)
        return
      }
      const { sessionToken } = await r.json()
      setSess(sessionToken)
      setStep('method')
    } catch {
      setPwErr('Erreur de connexion')
    }
    setBusy(false)
  }

  async function pickBank() {
    if (!d?.showIban) {
      setStep('iban')
      return
    }
    setBusy(true)
    try {
      const h: Record<string, string> = {}
      if (sess) h['X-Checkout-Session'] = sess
      const r = await fetch(api(`/checkout/${token}/iban`), { headers: h })
      if (!r.ok) {
        setErr((await r.json().catch(() => ({}))).message || 'Erreur')
        setStep('error')
        setBusy(false)
        return
      }
      setIb(await r.json())
      setStep('iban')
    } catch {
      setErr('Erreur de connexion')
      setStep('error')
    }
    setBusy(false)
  }

  async function pay() {
    setBusy(true)
    try {
      const r = await fetch(api(`/checkout/${token}/mark-paid`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (r.status === 409) {
        setStep('pending')
        setBusy(false)
        return
      }
      if (!r.ok) {
        setErr('Erreur')
        setStep('error')
        setBusy(false)
        return
      }
      setStep('pending')
      boom()
    } catch {
      setErr('Erreur')
      setStep('error')
    }
    setBusy(false)
  }

  async function dl() {
    setDling(true)
    try {
      const r = await fetch(api(`/checkout/${token}/pdf`))
      if (r.ok) {
        const b = await r.blob()
        const u = URL.createObjectURL(b)
        const a = document.createElement('a')
        a.href = u
        a.download = `${d?.invoiceNumber || 'facture'}.pdf`
        a.click()
        URL.revokeObjectURL(u)
      }
    } catch {
      /* ignore */
    }
    setDling(false)
  }

  function cp() {
    if (!ib?.ibanRaw) return
    navigator.clipboard.writeText(ib.ibanRaw)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const amt = d
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: d.currency }).format(d.amount)
    : ''

  return (
    <motion.div initial="hidden" animate="visible" className="w-full max-w-md mx-auto pt-8 pb-16">
      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-8">
          <FieldGroup>
            {step === 'loading' && (
              <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-6 py-8">
                <Spinner className="h-8 w-8 text-indigo-500" />
                <p className="text-sm text-muted-foreground">Chargement du paiement...</p>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-destructive"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold">Échec</h2>
                <p className="text-sm text-muted-foreground">{err}</p>
              </motion.div>
            )}

            {step === 'expired' && (
              <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted-foreground/10 flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold">Lien expiré</h2>
                <p className="text-sm text-muted-foreground">
                  Ce lien de paiement a expiré. Veuillez le renouveler auprès de l&apos;émetteur.
                </p>
              </motion.div>
            )}

            {step === 'password' && (
              <motion.div variants={fadeUp} custom={0} className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <svg
                      className="h-8 w-8 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold">Accès protégé</h2>
                  <p className="text-sm text-muted-foreground">
                    Ce lien est protégé par mot de passe. Veuillez le saisir.
                  </p>
                </div>

                {pwErr && (
                  <motion.div variants={fadeUp} custom={1}>
                    <FieldError className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      {pwErr}
                    </FieldError>
                  </motion.div>
                )}

                <Field>
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mot de passe"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitPw()}
                    autoFocus
                  />
                </Field>

                <Button type="button" onClick={submitPw} disabled={busy || !pw} className="w-full">
                  {busy ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" /> Envoi en cours…
                    </>
                  ) : (
                    'Accéder au paiement'
                  )}
                </Button>
              </motion.div>
            )}

            {step === 'method' && d && (
              <motion.div variants={fadeUp} custom={0} className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  {d.companyName && (
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {d.companyName}
                    </p>
                  )}
                  <p className="text-3xl font-bold text-foreground">{amt}</p>
                  <p className="text-sm text-muted-foreground">Facture {d.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Veuillez choisir votre mode de paiement ci‑dessous.
                  </p>
                </div>

                <div className="pt-2">
                  <FieldGroup>
                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-3 justify-start"
                      onClick={pickBank}
                      disabled={busy}
                    >
                      <svg
                        className="h-5 w-5 text-primary"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                      </svg>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Virement bancaire</p>
                        <p className="text-xs text-muted-foreground">
                          Paiement par coordination bancaire
                        </p>
                      </div>
                      {busy && <Spinner className="ml-auto h-4 w-4 text-muted-foreground" />}
                    </Button>

                    <Button
                      variant="outline"
                      disabled
                      className="opacity-40 cursor-not-allowed w-full flex items-center gap-3 justify-start"
                    >
                      <svg
                        className="h-5 w-5 text-muted-foreground"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="1" y="4" width="22" height="16" rx="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      <div className="text-left">
                        <p className="font-medium text-muted-foreground">Carte bancaire</p>
                        <p className="text-xs text-muted-foreground">Bientôt disponible</p>
                      </div>
                    </Button>
                  </FieldGroup>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>Paiement sécurisé – données chiffrées</span>
                </div>
              </motion.div>
            )}

            {step === 'iban' && d && (
              <motion.div variants={fadeUp} custom={0} className="flex flex-col
