'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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

  useEffect(() => {
    window.location.href = buildNext(searchParams.get('redirect'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default function LoginSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
