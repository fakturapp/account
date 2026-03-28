'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CompanyRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/settings/company')
  }, [router])

  return null
}
