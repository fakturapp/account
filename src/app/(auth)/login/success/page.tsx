'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { resolvePostAuthRedirect } from '@/lib/safe-redirect'

const DASH_URL = process.env.NEXT_PUBLIC_DASH_URL || ''

function buildNext(redirect: string | null): string {
  const target = resolvePostAuthRedirect(redirect)
  const base = DASH_URL.replace(/\/+$/, '')
  if (base && target.startsWith(base)) {
    return `${base}/sso?next=${encodeURIComponent(target)}`
  }
  return target
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const next = buildNext(searchParams.get('redirect'))
    const fade = setTimeout(() => setLeaving(true), 1400)
    const go = setTimeout(() => {
      window.location.href = next
    }, 1800)
    return () => {
      clearTimeout(fade)
      clearTimeout(go)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="w-full flex flex-col items-center justify-center py-16 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.45, duration: 0.6 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="mt-5 text-xl font-bold text-foreground"
      >
        Connexion réussie
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: leaving ? 0.4 : 1 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="mt-1 text-sm text-muted-foreground"
      >
        Redirection vers votre espace...
      </motion.p>
    </div>
  )
}

export default function LoginSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
