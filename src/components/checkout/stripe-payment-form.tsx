'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe, type Stripe, type Appearance } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Spinner } from '@/components/ui/spinner'
import { publicApi } from '@/lib/api'

const appearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#6366f1',
    colorBackground: 'rgba(255,255,255,0.03)',
    colorText: '#ffffff',
    colorDanger: '#ef4444',
    borderRadius: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '1px solid rgba(255,255,255,0.08)',
      backgroundColor: 'rgba(255,255,255,0.04)',
      padding: '12px 16px',
    },
    '.Input:focus': {
      borderColor: 'rgba(99,102,241,0.5)',
      boxShadow: '0 0 0 2px rgba(99,102,241,0.1)',
    },
    '.Label': {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '13px',
    },
  },
}

interface StripePaymentFormProps {
  token: string
  amount: string
  invoiceNumber: string
  onSuccess: () => void
  onError: (msg: string) => void
}

function PaymentForm({
  amount,
  onSuccess,
  onError,
}: {
  amount: string
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setPaying(true)
    setError('')

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || 'Erreur de validation')
      setPaying(false)
      return
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message || 'Le paiement a echoue')
      setPaying(false)
      onError(confirmError.message || 'Le paiement a echoue')
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess()
    }

    setPaying(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={paying || !stripe}
        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-40 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
      >
        {paying ? <Spinner className="text-white" /> : `Payer ${amount}`}
      </button>

      <div className="flex items-center justify-center gap-2 pt-1">
        <svg
          className="h-4 w-4 text-white/20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span className="text-[11px] text-white/20 font-medium">Securise par Stripe</span>
      </div>
    </form>
  )
}

export function StripePaymentForm({
  token,
  amount,
  invoiceNumber,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const initStripe = useCallback(async () => {
    try {
      const { data, error } = await publicApi.post<{
        clientSecret: string
        publishableKey: string
      }>(`/checkout/${token}/create-stripe-intent`, {})

      if (error || !data) {
        setError(error || 'Impossible de creer le paiement')
        setLoading(false)
        return
      }

      setStripePromise(loadStripe(data.publishableKey))
      setClientSecret(data.clientSecret)
    } catch {
      setError('Erreur de connexion')
    }
    setLoading(false)
  }, [token])

  useEffect(() => {
    initStripe()
  }, [initStripe])

  if (loading) {
    return (
      <div className="flex flex-col items-center py-8">
        <Spinner size="lg" className="text-indigo-400" />
        <p className="mt-4 text-sm text-white/40">Preparation du paiement...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (!stripePromise || !clientSecret) return null

  return (
    <div>
      <div className="text-center mb-6">
        <p className="text-2xl font-bold text-white">{amount}</p>
        <p className="text-sm text-white/40 mt-0.5">Facture {invoiceNumber}</p>
      </div>
      <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
        <PaymentForm amount={amount} onSuccess={onSuccess} onError={onError} />
      </Elements>
    </div>
  )
}
