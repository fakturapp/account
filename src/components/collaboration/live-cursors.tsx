'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { CollaboratorInfo, CursorPosition } from '@/hooks/use-collaboration'

interface LiveCursorsProps {
  cursors: Map<string, CursorPosition>
  collaborators: CollaboratorInfo[]
  /** Ref to the container element for relative positioning */
  containerRef: React.RefObject<HTMLElement | null>
}

function getDisplayName(collab: CollaboratorInfo): string {
  if (collab.fullName) {
    const parts = collab.fullName.split(' ')
    return parts[0] // First name only for cursor label
  }
  return collab.email.split('@')[0]
}

export function LiveCursors({ cursors, collaborators, containerRef }: LiveCursorsProps) {
  const collabMap = new Map(collaborators.map((c) => [c.userId, c]))

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      <AnimatePresence>
        {Array.from(cursors.entries()).map(([userId, pos]) => {
          const collab = collabMap.get(userId)
          if (!collab) return null

          return (
            <motion.div
              key={userId}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: pos.x,
                y: pos.y,
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                x: { type: 'spring', stiffness: 500, damping: 28, mass: 0.5 },
                y: { type: 'spring', stiffness: 500, damping: 28, mass: 0.5 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
              }}
              className="absolute top-0 left-0"
              style={{ willChange: 'transform' }}
            >
              {/* Cursor pointer SVG */}
              <svg
                width="16"
                height="20"
                viewBox="0 0 16 20"
                fill="none"
                className="drop-shadow-md"
              >
                <path
                  d="M0.928711 0.628906L15.0707 11.0569L8.06871 11.7509L4.41471 18.9549L0.928711 0.628906Z"
                  fill={collab.color}
                />
                <path
                  d="M0.928711 0.628906L15.0707 11.0569L8.06871 11.7509L4.41471 18.9549L0.928711 0.628906Z"
                  stroke="white"
                  strokeWidth="1"
                />
              </svg>

              {/* Name label */}
              <div
                className="ml-3 -mt-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white whitespace-nowrap shadow-sm"
                style={{ backgroundColor: collab.color }}
              >
                {getDisplayName(collab)}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
