'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Avatar } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { AccountIndicator } from '@/components/ui/account-indicator/account-indicator'
import { OtpInput } from '@/components/ui/otp-input'
import { CheckboxRoot, CheckboxControl, CheckboxIndicator, CheckboxContent } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth'
import { isFakturDesktop } from '@/lib/is-desktop'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { startAuthentication } from '@simplewebauthn/browser'
import { LogOut, LayoutDashboard, ArrowRight, Shield, Eye, EyeOff, KeyRound, Lock, Mail } from '@/components/ui/icons'

type EmailStatus = 'idle' | 'checking' | 'exists' | 'not-exists'
type TwoFactorMethod = 'totp' | 'email' | 'recovery'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LAST_LOGIN_TTL_MS = 30 * 24 * 60 * 60 * 1000

const METHOD_SWITCH_LABEL: Record<TwoFactorMethod, string> = {
  totp: "Utiliser l'application authenticator",
  email: 'Recevoir un code par email',
  recovery: 'Utiliser un code de récupération',
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

const OAUTH_ERRORS: Record<string, string> = {
  oauth_cancelled: 'Connexion Google annulée.',
  oauth_failed: 'Erreur lors de la connexion avec Google.',
  invalid_state: 'Session expirée, veuillez réessayer.',
  email_exists: 'Un compte existe déjà avec cet email. Connectez-vous avec votre mot de passe, puis liez Google depuis les paramètres.',
  account_inactive: 'Ce compte est désactivé.',
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, login, logout, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [twofaToken, setTwofaToken] = useState<string | null>(null)
  const [availableMethods, setAvailableMethods] = useState<TwoFactorMethod[]>(['totp', 'email', 'recovery'])
  const [maskedEmail, setMaskedEmail] = useState('')
  const [method, setMethod] = useState<TwoFactorMethod>('totp')
  const [trustDevice, setTrustDevice] = useState(false)
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [redirecting, setRedirecting] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [checkData, setCheckData] = useState<{ avatarUrl: string | null; initial: string } | null>(null)
  const [shouldAnimate] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      if (sessionStorage.getItem('faktur_login_animated')) return false
      sessionStorage.setItem('faktur_login_animated', '1')
      return true
    } catch {
      return true
    }
  })
  const redirectingRef = useRef(false)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const resetTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  const goSuccess = useCallback(
    (redirect: string | null) => {
      redirectingRef.current = true
      setRedirecting(true)
      const qs = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
      router.push(`/login/success${qs}`)
    },
    [router]
  )

  const cleanUrl = useCallback(() => {
    const redirect = searchParams.get('redirect')
    const qs = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
    window.history.replaceState({}, '', window.location.pathname + qs)
  }, [searchParams])

  useEffect(() => {
    setIsDesktop(isFakturDesktop())
  }, [])

  useEffect(() => {
    const token = searchParams.get('token')
    const twofa = searchParams.get('twofa')
    const oauthError = searchParams.get('error')

    if (token) {
      cleanUrl()
      localStorage.setItem('faktur_token', token)
      api.get<{ user: any }>('/auth/me').then(({ data, error: err }) => {
        if (err || !data?.user) {
          localStorage.removeItem('faktur_token')
          toast('Erreur lors de la connexion automatique.', 'error')
          return
        }
        login(token, data.user)
        goSuccess(searchParams.get('redirect'))
      })
    } else if (twofa) {
      cleanUrl()
      setTwofaToken(twofa)
      setAvailableMethods(['totp', 'email', 'recovery'])
      setMethod('totp')
      setRequires2FA(true)
    } else if (oauthError) {
      cleanUrl()
      toast(OAUTH_ERRORS[oauthError] || 'Une erreur est survenue.', 'error')
    }
  }, [])

  useEffect(() => {
    if (isDesktop) return

    const emailParam = searchParams.get('email')
    if (emailParam && EMAIL_REGEX.test(emailParam)) {
      setEmail(emailParam)
    }

    if (searchParams.get('token') || searchParams.get('twofa')) return

    try {
      const raw = localStorage.getItem('faktur_last_login')
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        email?: string
        avatarUrl?: string | null
        initial?: string
        ts?: number
      }
      if (!parsed.email || !parsed.ts || Date.now() - parsed.ts > LAST_LOGIN_TTL_MS) {
        localStorage.removeItem('faktur_last_login')
        return
      }
      setEmail(parsed.email)
      setCheckData({
        avatarUrl: parsed.avatarUrl ?? null,
        initial: (parsed.initial ?? parsed.email[0] ?? '?').toUpperCase(),
      })
      setEmailStatus('exists')
      setPasswordVisible(true)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop])

  useEffect(() => {
    if (requires2FA) return
    if (passwordVisible) return
    if (!email || !EMAIL_REGEX.test(email)) {
      setEmailStatus('idle')
      return
    }

    setEmailStatus('checking')
    const timer = setTimeout(async () => {
      const { data, error: err } = await api.post<{
        exists: boolean
        avatarUrl?: string | null
        initial?: string
      }>('/auth/check-email', { email })

      if (err) {
        setEmailStatus('idle')
        return
      }

      if (!data?.exists) {
        setEmailStatus('not-exists')
        return
      }

      setCheckData({
        avatarUrl: data.avatarUrl ?? null,
        initial: (data.initial ?? email[0] ?? '?').toUpperCase(),
      })
      setEmailStatus('exists')
    }, 700)

    return () => clearTimeout(timer)
     
  }, [email, requires2FA, passwordVisible])

  function resetEmail() {
    setEmailStatus('idle')
    setCheckData(null)
    setEmail('')
    setPassword('')
    setPasswordVisible(false)
    try {
      localStorage.removeItem('faktur_last_login')
    } catch {}
  }

  function exitTwoFactor() {
    setRequires2FA(false)
    setTwofaToken(null)
    setUserId(null)
    setCode('')
    setMethod('totp')
    setEmailCodeSent(false)
    setTrustDevice(false)
    setMaskedEmail('')
  }

  function changeMethod(next: TwoFactorMethod) {
    setMethod(next)
    setCode('')
    setEmailCodeSent(false)
  }

  function twoFactorIdentity() {
    return twofaToken ? { twofaToken } : { userId }
  }

  async function sendEmailCode() {
    setSendingCode(true)
    const { data, error: err } = await api.post<{ ok: boolean; email: string }>(
      '/auth/login/2fa/send-email',
      twoFactorIdentity()
    )
    setSendingCode(false)
    if (err) return toast(err, 'error')
    if (data?.email) setMaskedEmail(data.email)
    setEmailCodeSent(true)
    toast('Code envoyé par email.', 'success')
  }

  async function lostCode() {
    const { data } = await api.post<{ message: string }>('/auth/login/2fa/lost', twoFactorIdentity())
    toast(data?.message || 'Un administrateur a été notifié.', 'success')
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    const { data, error: err } = await api.get<{ url: string }>('/auth/oauth/google/url')
    if (err || !data?.url) {
      setGoogleLoading(false)
      return toast(err || 'Impossible de se connecter avec Google.', 'error')
    }
    window.location.href = data.url
  }

  async function handlePasskeyLogin() {
    setPasskeyLoading(true)
    try {
      const { data: options, error: optErr } = await api.post<any>('/auth/passkey/login-options', {})
      if (optErr || !options) {
        setPasskeyLoading(false)
        return toast(optErr || "Impossible de démarrer l'authentification par clé d'accès.", 'error')
      }

      const credential = await startAuthentication({ optionsJSON: options })

      const { data, error: verifyErr } = await api.post<{
        token?: string
        user?: any
        vaultKey?: string
        requiresEmailVerification?: boolean
        email?: string
      }>('/auth/passkey/login-verify', { credential })
      setPasskeyLoading(false)

      if (verifyErr) return toast(verifyErr, 'error')

      if (data?.requiresEmailVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(data.email || '')}`)
        return
      }

      if (data?.token && data?.user) {
        login(data.token, data.user, data.vaultKey)
        goSuccess(searchParams.get('redirect'))
      }
    } catch (err: any) {
      setPasskeyLoading(false)
      if (err.name === 'NotAllowedError') {
        return
      }
      console.error('[Passkey]', err)
      toast(err.message || "Erreur lors de l'authentification par clé d'accès.", 'error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (requires2FA) {
      setLoading(true)
      const { data, error: err } = await api.post<{ token?: string; user?: any }>('/auth/login/2fa', {
        ...twoFactorIdentity(),
        code,
        method,
        trustDevice,
      })
      setLoading(false)
      if (err) return toast(err, 'error')
      if (data?.token && data?.user) {
        login(data.token, data.user)
        goSuccess(searchParams.get('redirect'))
      }
      return
    }

    setLoading(true)
    const { data, error: err } = await api.post<{
      token?: string
      requiresTwoFactor?: boolean
      requiresEmailVerification?: boolean
      email?: string
      userId?: string
      availableMethods?: TwoFactorMethod[]
      user?: any
      vaultKey?: string
    }>('/auth/login', { email, password, turnstileToken })
    setLoading(false)

    if (err) {
      resetTurnstile()
      return toast(err, 'error')
    }

    if (data?.requiresEmailVerification) {
      router.push(`/verify-email?email=${encodeURIComponent(data.email || email)}`)
      return
    }

    if (data?.requiresTwoFactor) {
      setRequires2FA(true)
      setUserId(data.userId ?? null)
      setAvailableMethods(data.availableMethods ?? ['totp', 'email', 'recovery'])
      setMaskedEmail(data.email ?? '')
      setMethod('totp')
      return
    }

    if (data?.token && data?.user) {
      login(data.token, data.user, data.vaultKey)
      goSuccess(searchParams.get('redirect'))
    }
  }

  useEffect(() => {
    if (authLoading || !user) return
    if (redirectingRef.current) return
    const redirectParam = searchParams.get('redirect')
    if (!redirectParam) return
    goSuccess(redirectParam)
  }, [authLoading, user, searchParams, goSuccess])

  if (redirecting) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm mx-auto flex flex-col items-center justify-center py-20"
      >
        <Spinner size="lg" className="text-accent" />
        <p className="mt-4 text-sm font-medium text-foreground">Connexion en cours...</p>
      </motion.div>
    )
  }

  if (isDesktop && !authLoading && !user) {
    return (
      <motion.div initial={shouldAnimate ? 'hidden' : false} animate="visible" className="w-full max-w-sm mx-auto">
        <div className="rounded-xl bg-overlay shadow-surface p-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-base font-semibold text-foreground mb-1">
            Connexion via Faktur Desktop
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            La connexion par email et mot de passe n&apos;est pas disponible dans l&apos;application de
            bureau. Retournez à l&apos;écran d&apos;accueil et cliquez sur «&nbsp;Se connecter avec
            Faktur&nbsp;» pour lancer le flow OAuth sécurisé.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).fakturDesktop?.logout) {
                ;(window as any).fakturDesktop.logout()
              }
            }}
          >
            Retour à l&apos;écran de connexion
          </Button>
        </div>
      </motion.div>
    )
  }

  if (!authLoading && user) {
    const initials = user.fullName
      ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
      : user.email.slice(0, 2).toUpperCase()

    return (
      <motion.div initial={shouldAnimate ? 'hidden' : false} animate="visible" className="w-full max-w-sm mx-auto">
        <div className="space-y-6">
          <motion.div variants={fadeIn} custom={0} className="flex flex-col items-center gap-5 text-center">
            <Avatar
              src={user.avatarUrl}
              alt={user.fullName || user.email}
              fallback={initials}
              size="lg"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">Bon retour, {user.fullName?.split(' ')[0] || 'vous'} !</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Connecté en tant que <span className="font-medium text-foreground">{user.fullName || user.email}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} custom={1}>
            <Separator />
          </motion.div>

          <motion.div variants={fadeIn} custom={2} className="space-y-3">
            <Button className="w-full h-11" onClick={() => goSuccess(searchParams.get('redirect'))}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Aller au Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={async () => { await logout() }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  const registerHref = (() => {
    const r = searchParams.get('redirect')
    return r ? `/register?redirect=${encodeURIComponent(r)}` : '/register'
  })()

  const twoFactorSubtitle =
    method === 'recovery'
      ? 'Entrez un de vos codes de récupération'
      : method === 'email'
        ? emailCodeSent
          ? `Code envoyé à ${maskedEmail || 'votre adresse email'}`
          : `Recevez un code à ${maskedEmail || 'votre adresse email'}`
        : 'Entrez le code à 6 chiffres de votre application authenticator'

  return (
    <motion.div initial="hidden" animate="visible" className="w-full">
      <AnimatePresence mode="wait">
        {requires2FA ? (
          <motion.div
            key="2fa"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="space-y-7">
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Vérification en deux étapes</h1>
                  <p className="text-sm text-muted-foreground mt-1">{twoFactorSubtitle}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {method === 'totp' && (
                  <div className="flex justify-center py-1">
                    <OtpInput
                      id="code"
                      value={code}
                      onChange={setCode}
                      length={6}
                      groupSize={3}
                      autoFocus
                      purpose="totp"
                      ariaLabel="Code de vérification 2FA"
                    />
                  </div>
                )}

                {method === 'recovery' && (
                  <Input
                    id="code"
                    type="text"
                    placeholder="XXXXX-XXXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="text-center text-lg tracking-widest font-mono h-12"
                    maxLength={11}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    autoFocus
                  />
                )}

                {method === 'email' && (
                  emailCodeSent ? (
                    <div className="space-y-3">
                      <div className="flex justify-center py-1">
                        <OtpInput
                          id="code"
                          value={code}
                          onChange={setCode}
                          length={6}
                          groupSize={3}
                          autoFocus
                          purpose="email"
                          ariaLabel="Code reçu par email"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={sendEmailCode}
                        disabled={sendingCode}
                        className="block mx-auto text-sm text-accent hover:text-accent/80 transition-colors disabled:opacity-60"
                      >
                        {sendingCode ? 'Envoi...' : 'Renvoyer le code'}
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={sendEmailCode}
                      disabled={sendingCode}
                      className="w-full h-11 font-semibold gap-2"
                    >
                      {sendingCode ? <><Spinner /> Envoi...</> : <>Envoyer le code par email <Mail className="h-4 w-4" /></>}
                    </Button>
                  )
                )}

                <CheckboxRoot
                  isSelected={trustDevice}
                  onChange={setTrustDevice}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <CheckboxControl>
                    <CheckboxIndicator />
                  </CheckboxControl>
                  <CheckboxContent className="text-sm text-muted-foreground">
                    Ne plus demander pendant 30 jours sur cet appareil
                  </CheckboxContent>
                </CheckboxRoot>

                {!(method === 'email' && !emailCodeSent) && (
                  <Button type="submit" className="w-full h-11 font-semibold" disabled={loading || !code}>
                    {loading ? <><Spinner /> Vérification...</> : 'Vérifier'}
                  </Button>
                )}

                <div className="flex flex-col items-center gap-2 pt-1">
                  {availableMethods
                    .filter((m) => m !== method)
                    .map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => changeMethod(m)}
                        className="text-sm text-accent hover:text-accent/80 transition-colors"
                      >
                        {METHOD_SWITCH_LABEL[m]}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={lostCode}
                    className="text-sm text-accent underline underline-offset-4 hover:text-accent/80 transition-colors"
                  >
                    J&apos;ai oublié mon code
                  </button>
                  <button
                    type="button"
                    onClick={exitTwoFactor}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Retour à la connexion
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="space-y-8">
              <motion.div variants={fadeIn} custom={0} className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Bienvenue sur Faktur</h1>
                <p className="text-sm text-muted-foreground">
                  Connectez-vous ou inscrivez-vous pour démarrer
                </p>
              </motion.div>

              <motion.div variants={fadeIn} custom={1} className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-all hover:bg-surface-hover disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  Continuer avec Google
                </button>

                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={passkeyLoading}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-all hover:bg-surface-hover disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {passkeyLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  Clé d&apos;accès
                </button>
              </motion.div>

              <motion.div variants={fadeIn} custom={2} className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wider rounded-full">ou</span>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} custom={3}>
                <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
                  <input
                    type="text"
                    name="username"
                    id="login-username"
                    autoComplete="username"
                    value={email}
                    readOnly
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={() => {}}
                    style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden', opacity: 0 }}
                  />

                  <div className="relative h-[60px]">
                    <AnimatePresence mode="wait" initial={false}>
                      {(passwordVisible || emailStatus === 'exists') && checkData ? (
                        <motion.div
                          key="indicator"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute inset-0"
                        >
                          <AccountIndicator
                            email={email}
                            avatarUrl={checkData.avatarUrl}
                            fallback={checkData.initial}
                            onClear={resetEmail}
                            className="h-full !py-0"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="input"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0"
                        >
                          <div className="h-full rounded-xl border border-border bg-card shadow-surface px-4 flex items-center">
                            <div className="flex items-center gap-3 w-full">
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="vous@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="username"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                required
                                autoFocus
                                aria-label="Adresse email"
                                className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                              />
                              {emailStatus === 'checking' && (
                                <div className="shrink-0">
                                  <Spinner size="sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    {emailStatus === 'not-exists' ? (
                      <motion.div
                        key="create"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Button
                          type="button"
                          className="w-full h-11 font-semibold gap-2"
                          onClick={() => router.push('/register?email=' + encodeURIComponent(email))}
                        >
                          Créer un compte <ArrowRight className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ) : emailStatus === 'exists' && !passwordVisible ? (
                      <motion.div
                        key="continue"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Button
                          type="button"
                          className="w-full h-11 font-semibold"
                          onClick={() => setPasswordVisible(true)}
                          autoFocus
                        >
                          Continuer
                        </Button>
                      </motion.div>
                    ) : passwordVisible ? (
                      <motion.div
                        key="password"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-4"
                      >
                        <Field>
                          <div className="flex items-center justify-between">
                            <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                            <Link
                              href="/forgot-password"
                              className="text-xs text-accent hover:text-accent/80 transition-colors"
                            >
                              Oublié ?
                            </Link>
                          </div>
                          <div className="relative">
                            <Input
                              id="password"
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              autoComplete="current-password"
                              required
                              autoFocus
                              className="h-11 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                              tabIndex={-1}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </Field>

                        {process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === 'true' && process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && (
                          <div className="flex justify-center">
                            <Turnstile
                              ref={turnstileRef}
                              siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY}
                              onSuccess={setTurnstileToken}
                              onError={resetTurnstile}
                              onExpire={resetTurnstile}
                              options={{ theme: 'dark', language: 'fr' }}
                            />
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full h-11 font-semibold"
                          disabled={loading || (process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === 'true' && !!process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && !turnstileToken)}
                        >
                          {loading ? (
                            <><Spinner /> Connexion...</>
                          ) : (
                            'Se connecter'
                          )}
                        </Button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <p className="text-center text-sm text-muted-foreground">
                    Pas encore de compte ?{' '}
                    <Link
                      href={registerHref}
                      className="text-accent font-medium hover:text-accent/80 transition-colors"
                    >
                      Créer un compte
                    </Link>
                  </p>
                </form>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
