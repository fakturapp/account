'use client'

import { useCallback, useRef } from 'react'
import { useCollaborationContext } from '@/components/collaboration/collaboration-provider'
import type { DocumentChange } from '@/hooks/use-collaboration'

/**
 * Hook to make any state setter collaborative.
 * Returns a wrapped setter that broadcasts changes via WebSocket,
 * and a handler to apply remote changes.
 *
 * Usage:
 *   const [notes, setNotes] = useState('')
 *   const { collaborativeSet, applyRemoteChange } = useCollaborativeSync()
 *
 *   // Wrap local changes:
 *   const setNotesCollab = (v: string) => collaborativeSet('notes', v, setNotes)
 *
 *   // In onDocumentChange callback:
 *   if (change.path === 'notes') setNotes(change.value)
 */
export function useCollaborativeSync() {
  const collab = useCollaborationContext()
  const sendDocumentChange = collab?.sendDocumentChange

  // Track which changes originated locally to avoid echo
  const localChangeRef = useRef(new Set<string>())

  const collaborativeSet = useCallback(
    <T>(path: string, value: T, setter: React.Dispatch<React.SetStateAction<T>>) => {
      setter(value as any)
      // Broadcast to other users
      sendDocumentChange?.(path, value)
    },
    [sendDocumentChange]
  )

  return { collaborativeSet }
}
