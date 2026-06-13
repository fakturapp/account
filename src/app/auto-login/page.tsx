'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

function AutoLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const consumed = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (consumed.current) return
    consumed.current = true

    const code = searchParams.get('code')
    if (!code) {
      setError('Lien invalide.')
      return
    }

    window.history.replaceState({}, '', '/auto-login')

    api
      .post<{ token: string }>('/account/web-login-token/redeem', { code })
      .then(({ data, error: err }) => {
        if (err || !data?.token) {
          setError('Ce lien a expiré ou a déjà été utilisé. Réessayez depuis l’application.')
          return
        }
        localStorage.setItem('faktur_token', data.token)
        router.replace('/settings')
      })
      .catch(() => setError('Connexion impossible. Réessayez.'))
  }, [router, searchParams])

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      {error ? (
        <div style={{ maxWidth: 320 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Connexion impossible</p>
          <p style={{ opacity: 0.7, fontSize: 14 }}>{error}</p>
        </div>
      ) : (
        <p style={{ opacity: 0.7 }}>Connexion sécurisée en cours…</p>
      )}
    </div>
  )
}

export default function AutoLoginPage() {
  return (
    <Suspense>
      <AutoLoginContent />
    </Suspense>
  )
}
