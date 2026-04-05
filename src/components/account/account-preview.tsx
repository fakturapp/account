'use client'

import { useAuth } from '@/lib/auth'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useRef, useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import {
  Camera, Shield, Calendar, Globe, KeyRound, ShieldCheck,
  Fingerprint, Link2,
} from 'lucide-react'

interface Provider {
  provider: string
  email: string | null
  createdAt: string
}

interface Passkey {
  id: string
  friendlyName: string
  backedUp: boolean
  createdAt: string
  lastUsedAt: string | null
}

export function AccountPreview() {
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [loaded, setLoaded] = useState(false)

  const initials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email || '').slice(0, 2).toUpperCase()

  useEffect(() => {
    async function load() {
      const [provRes, pkRes] = await Promise.all([
        api.get<{ providers: Provider[] }>('/account/providers'),
        api.get<{ passkeys: Passkey[] }>('/account/passkeys'),
      ])
      if (provRes.data?.providers) setProviders(provRes.data.providers)
      if (pkRes.data?.passkeys) setPasskeys(pkRes.data.passkeys)
      setLoaded(true)
    }
    load()
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    const formData = new FormData()
    formData.append('avatar', file)
    await api.upload('/account/avatar', formData)
    await refreshUser()
    setAvatarUploading(false)
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="w-[280px] shrink-0 space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 sticky top-4">
        {/* Avatar + name */}
        <div className="flex flex-col items-center text-center">
          <div className="relative group mb-3">
            <Avatar
              src={user?.avatarUrl}
              alt={user?.fullName || ''}
              fallback={initials}
              size="lg"
              className="h-20 w-20 text-lg ring-4 ring-card"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors cursor-pointer"
              title="Changer la photo"
            >
              {avatarUploading ? (
                <Spinner className="h-3 w-3" />
              ) : (
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
          <h3 className="text-sm font-bold text-foreground">{user?.fullName || 'Utilisateur'}</h3>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          {memberSince && (
            <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Membre depuis {memberSince}
            </p>
          )}
        </div>

        <Separator />

        {/* 2FA status */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">S&eacute;curit&eacute;</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-foreground">Double authentification</span>
            </div>
            <Badge variant={user?.twoFactorEnabled ? 'success' : 'muted'} className="text-[9px] px-1.5">
              {user?.twoFactorEnabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Providers */}
        {loaded && providers.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Comptes li&eacute;s</p>
              {providers.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50">
                    {p.provider === 'google' ? (
                      <Globe className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Link2 className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground capitalize">{p.provider}</p>
                    {p.email && <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Passkeys */}
        {loaded && passkeys.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cl&eacute;s d&apos;acc&egrave;s</p>
              {passkeys.map((pk) => (
                <div key={pk.id} className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50">
                    {pk.backedUp ? (
                      <ShieldCheck className="h-3 w-3 text-green-500" />
                    ) : (
                      <Fingerprint className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{pk.friendlyName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {pk.lastUsedAt
                        ? `Utilis\u00e9e ${new Date(pk.lastUsedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                        : `Cr\u00e9\u00e9e ${new Date(pk.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loaded && (
          <div className="flex items-center justify-center py-4">
            <Spinner className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  )
}
