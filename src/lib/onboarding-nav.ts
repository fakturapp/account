'use client'

import { useRouter } from 'next/navigation'

export function useOnboardingNav() {
  const router = useRouter()

  function go(path: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('faktur:onboarding-navigate'))
    }
    router.push(path)
  }

  return go
}
