'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { asset } from '@/lib/asset'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DashboardBackground } from '@/components/layout/dashboard-background'
import { AccountPreview } from '@/components/settings/settings-preview'
import { User, Shield, Monitor, Link2, LogOut, ArrowLeft } from '@/components/ui/icons'

const DASH_URL = process.env.NEXT_PUBLIC_DASH_URL || '/'

const NAV = [
  { href: '/settings', label: 'Mon compte', icon: User },
  { href: '/settings/security', label: 'Sécurité', icon: Shield },
  { href: '/settings/sessions', label: 'Sessions', icon: Monitor },
  { href: '/settings/oauth', label: 'Connexions', icon: Link2 },
]

const PAGES_WITH_PREVIEW = ['/settings', '/settings/security']

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isFullBleed =
    pathname === '/settings/delete' || pathname === '/settings/google-linked'

  const showPreview = PAGES_WITH_PREVIEW.some(
    (p) => pathname === p || (p !== '/settings' && pathname.startsWith(p))
  )

  async function confirmLogout() {
    setLogoutConfirm(false)
    setLoggingOut(true)
    await logout()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" className="text-accent" />
      </div>
    )
  }

  if (!user) {
    router.replace('/login')
    return null
  }

  if (isFullBleed) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="relative min-h-screen bg-background">
      <DashboardBackground />

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-(--header-height,4rem) max-w-5xl items-center justify-between gap-4 px-4 lg:px-6">
          <Link href="/settings" className="flex items-center gap-2.5">
            <img src={asset('/logo.svg')} alt="Faktur" className="h-7 w-7" />
            <span className="text-lg font-bold tracking-[-0.03em] text-foreground">Faktur</span>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href={DASH_URL}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour à Faktur</span>
            </a>
            <Avatar
              src={user.avatarUrl}
              alt={user.fullName || user.email}
              fallback={(user.fullName || user.email || '?').charAt(0).toUpperCase()}
              size="sm"
            />
          </div>
        </div>

        <nav className="mx-auto max-w-5xl px-4 lg:px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const active =
                item.href === '/settings'
                  ? pathname === '/settings'
                  : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                    active
                      ? 'border-accent text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={() => setLogoutConfirm(true)}
              className="ml-auto inline-flex items-center gap-2 px-3 py-3 text-sm font-medium whitespace-nowrap text-danger transition-colors hover:text-danger/80"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Se déconnecter</span>
            </button>
          </div>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl">
        <div className="flex gap-6 px-4 lg:px-6 py-4 md:py-6">
          <div className="min-w-0 flex-1">{children}</div>
          {showPreview && (
            <div className="hidden xl:block">
              <AccountPreview />
            </div>
          )}
        </div>
      </main>

      <Dialog open={logoutConfirm} onClose={() => setLogoutConfirm(false)}>
        <DialogHeader showClose={false} icon={<LogOut className="h-5 w-5 text-danger" />}>
          <DialogTitle>Se déconnecter</DialogTitle>
          <DialogDescription>Vous allez être déconnecté de votre compte</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLogoutConfirm(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmLogout}>
            Se déconnecter
          </Button>
        </DialogFooter>
      </Dialog>

      {loggingOut && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md">
          <Spinner size="lg" className="text-accent" />
          <p className="mt-4 text-sm font-medium text-foreground">Deconnexion en cours...</p>
        </div>
      )}
    </div>
  )
}
