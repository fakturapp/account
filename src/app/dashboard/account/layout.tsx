'use client'

import { AccountPreview } from '@/components/account/account-preview'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        {children}
      </div>
      <div className="hidden xl:block">
        <AccountPreview />
      </div>
    </div>
  )
}
