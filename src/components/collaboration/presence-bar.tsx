'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { CollaboratorInfo } from '@/hooks/use-collaboration'

interface PresenceBarProps {
  collaborators: CollaboratorInfo[]
  className?: string
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export function PresenceBar({ collaborators, className }: PresenceBarProps) {
  if (collaborators.length === 0) return null

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <AnimatePresence mode="popLayout">
        {collaborators.map((collab) => (
          <motion.div
            key={collab.userId}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            className="group relative"
          >
            {/* Avatar */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2 ring-card transition-transform group-hover:scale-110"
              style={{ backgroundColor: collab.color }}
              title={collab.fullName ?? collab.email}
            >
              {collab.avatarUrl ? (
                <img
                  src={collab.avatarUrl}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                getInitials(collab.fullName, collab.email)
              )}

              {/* Online indicator dot */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
            </div>

            {/* Tooltip */}
            <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-zinc-700">
                <p className="font-medium">{collab.fullName ?? collab.email}</p>
                <p className="text-zinc-400">
                  {collab.isOwner
                    ? 'Proprietaire'
                    : collab.permission === 'editor'
                      ? 'Peut modifier'
                      : 'Lecture seule'}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Count badge when many collaborators */}
      {collaborators.length > 5 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          +{collaborators.length - 5}
        </div>
      )}
    </div>
  )
}
