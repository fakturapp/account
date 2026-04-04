'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { ShareModal } from '@/components/collaboration/share-modal'
import { PresenceBar } from '@/components/collaboration/presence-bar'
import { LiveCursors } from '@/components/collaboration/live-cursors'
import { ReadOnlyBanner } from '@/components/collaboration/read-only-banner'
import { useCollaborationContext } from '@/components/collaboration/collaboration-provider'
import { Share2, Wifi, WifiOff, FlaskConical } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────

type DocumentType = 'invoice' | 'quote' | 'credit_note'

interface CollaborationToolbarProps {
  documentType: DocumentType
  documentId: string | null
  isAdmin?: boolean
  className?: string
}

/**
 * Drop-in toolbar component for the editor header.
 * Collaboration features are restricted to admins (beta).
 */
export function CollaborationToolbar({
  documentType,
  documentId,
  isAdmin = false,
  className,
}: CollaborationToolbarProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const { toast } = useToast()
  const collab = useCollaborationContext()

  const collaborators = collab?.collaborators ?? []
  const isConnected = collab?.isConnected ?? false

  const handleShareClick = () => {
    if (!isAdmin) {
      toast('Cette fonctionnalite est reservee aux administrateurs', 'error')
      return
    }
    setShareOpen(true)
  }

  return (
    <>
      <div className={className}>
        {/* Beta badge */}
        {documentId && (
          <div className="flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-500 uppercase tracking-wider">
            <FlaskConical className="h-3 w-3" />
            Beta
          </div>
        )}

        {/* Connection indicator */}
        {documentId && collaborators.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1" title={isConnected ? 'Connecte en temps reel' : 'Reconnexion...'}>
            {isConnected ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-amber-500 animate-pulse" />
            )}
          </div>
        )}

        {/* Presence avatars */}
        <PresenceBar collaborators={collaborators} />

        {/* Share button */}
        {documentId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareClick}
            className="gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            Partager
          </Button>
        )}
      </div>

      {/* Share modal — only opens for admins */}
      {documentId && isAdmin && (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          documentType={documentType}
          documentId={documentId}
        />
      )}
    </>
  )
}

// ── Read-only banner (uses context) ───────────────────────────────────────

export function CollaborationReadOnlyBanner() {
  const collab = useCollaborationContext()
  if (!collab || collab.myPermission !== 'viewer') return null
  return <ReadOnlyBanner />
}

// ── Collaboration wrapper for the editor area ─────────────────────────────

interface CollaborationEditorProps {
  editorRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}

export function CollaborationEditor({
  editorRef,
  children,
}: CollaborationEditorProps) {
  const collab = useCollaborationContext()

  const collaborators = collab?.collaborators ?? []
  const cursors = collab?.cursors ?? new Map()
  const isConnected = collab?.isConnected ?? false
  const myPermission = collab?.myPermission
  const sendCursorMove = collab?.sendCursorMove

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!editorRef.current || !isConnected || !sendCursorMove) return
      const rect = editorRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const xPct = (e.clientX - rect.left) / rect.width
      const yPct = (e.clientY - rect.top) / rect.height
      sendCursorMove(xPct, yPct)
    },
    [editorRef, isConnected, sendCursorMove]
  )

  const handlePointerLeave = useCallback(() => {
    sendCursorMove?.(-1, -1)
  }, [sendCursorMove])

  const isReadOnly = myPermission === 'viewer'

  return (
    <div
      className="relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      ref={editorRef as React.RefObject<HTMLDivElement>}
    >
      {isConnected && collaborators.length > 0 && (
        <LiveCursors
          cursors={cursors}
          collaborators={collaborators}
          containerRef={editorRef}
        />
      )}

      {isReadOnly && (
        <div className="absolute inset-0 z-30 cursor-not-allowed" title="Lecture seule - vous ne pouvez pas modifier ce document">
          <div className="pointer-events-none">{children}</div>
        </div>
      )}

      {!isReadOnly && children}
    </div>
  )
}
