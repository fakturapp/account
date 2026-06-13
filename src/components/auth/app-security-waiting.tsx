'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

type Status = 'creating' | 'waiting' | 'denied' | 'expired' | 'error'

interface Props {
  onVerified: () => void
  onNoDevice?: () => void
}

export function AppSecurityWaiting({ onVerified, onNoDevice }: Props) {
  const [matchCode, setMatchCode] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('creating')
  const challengeIdRef = useRef<string | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  function start() {
    setStatus('creating')
    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | undefined
    let deadline = Date.now() + 130_000

    const poll = async () => {
      if (cancelled || !challengeIdRef.current) return
      if (Date.now() > deadline) return setStatus('expired')
      const { data } = await api.get<{ status: string; verified?: boolean }>(
        `/account/security/app-challenge/${challengeIdRef.current}`
      )
      if (cancelled) return
      if (data?.status === 'approved' && data.verified) {
        onVerified()
        return
      }
      if (data?.status === 'denied') return setStatus('denied')
      if (data?.status === 'expired' || data?.status === 'consumed') return setStatus('expired')
      pollTimer = setTimeout(poll, 2000)
    }

    const create = async () => {
      const { data, error } = await api.post<{
        challengeId: string
        requireMatch: boolean
        matchCode: string | null
        expiresIn?: number
      }>('/account/security/app-challenge', {})
      if (cancelled) return
      if (error || !data?.challengeId) {
        if (onNoDevice) onNoDevice()
        setStatus('error')
        return
      }
      challengeIdRef.current = data.challengeId
      if (data.expiresIn && data.expiresIn > 0) deadline = Date.now() + (data.expiresIn + 5) * 1000
      setMatchCode(data.matchCode)
      setStatus('waiting')
      poll()
    }

    create()
    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
    }
  }

  useEffect(() => {
    cleanupRef.current = start()
    return () => cleanupRef.current?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retry = () => {
    cleanupRef.current?.()
    challengeIdRef.current = null
    cleanupRef.current = start()
  }

  if (status === 'denied' || status === 'expired' || status === 'error') {
    const msg =
      status === 'denied'
        ? 'Action refusée depuis votre téléphone.'
        : status === 'expired'
          ? 'La demande a expiré.'
          : 'Aucun appareil disponible. Utilisez une autre méthode.'
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>{msg}</p>
        <button
          onClick={retry}
          style={{
            marginTop: 8,
            padding: '10px 18px',
            borderRadius: 12,
            background: '#5957e8',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center', padding: 24 }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>Ouvrez Faktur sur votre téléphone</p>
      <p style={{ opacity: 0.7, fontSize: 14, marginBottom: matchCode ? 20 : 8 }}>
        Confirmez votre identité en appuyant sur « Oui, c’est moi ».
      </p>

      {matchCode && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ opacity: 0.7, fontSize: 13, marginBottom: 8 }}>
            Sélectionnez ce numéro dans l’application :
          </p>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: 4,
              color: '#5957e8',
            }}
          >
            {matchCode}
          </div>
        </div>
      )}

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: 0.7 }}>
        <span
          style={{
            width: 16,
            height: 16,
            border: '2px solid #5957e8',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: 14 }}>En attente d’approbation…</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
