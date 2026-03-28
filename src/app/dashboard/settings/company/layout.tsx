'use client'

import { CompanySettingsProvider } from '@/lib/company-settings-context'

export default function CompanySettingsLayout({ children }: { children: React.ReactNode }) {
  return <CompanySettingsProvider>{children}</CompanySettingsProvider>
}
