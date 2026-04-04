'use client'

import { useEffect, useRef } from 'react'
import { useCollaborationContext } from '@/components/collaboration/collaboration-provider'

/**
 * Broadcasts a value change to collaborators whenever it changes.
 * Uses a ref to track previous value and only sends on actual changes.
 * Skip the first render (initial load) to avoid broadcasting defaults.
 */
export function useBroadcast(path: string, value: any) {
  const collab = useCollaborationContext()
  const prevRef = useRef<any>(undefined)
  const initializedRef = useRef(false)

  useEffect(() => {
    // Skip the initial render
    if (!initializedRef.current) {
      initializedRef.current = true
      prevRef.current = value
      return
    }

    // Only broadcast if value actually changed
    if (prevRef.current !== value && collab?.sendDocumentChange) {
      collab.sendDocumentChange(path, value)
    }
    prevRef.current = value
  }, [value, path, collab])
}
