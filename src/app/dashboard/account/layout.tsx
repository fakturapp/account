'use client'

import { usePathname } from 'next/navigation'
import { AccountPreview } from '@/components/account/account-preview'

const PAGES_WITH_PREVIEW = ['/dashboard/account', '/dashboard/account/security']

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showPreview = PAGES_WITH_PREVIEW.some(
    (p) => pathname === p || (p !== '/dashboard/account' && pathname.startsWith(p))
  )

  return (
    <div className="flex gap-6 px-4 lg:px-6 py-4 md:py-6">
      <div className="flex-1 min-w-0">
        {children}
      </div>
      {showPreview && (
        <div className="hidden xl:block">
          <AccountPreview />
        </div>
      )}
    </div>
  )
}
