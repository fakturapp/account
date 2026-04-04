'use client'

import { createContext, useContext, type ReactNode } from 'react'
import {
  useCollaboration,
  type UseCollaborationReturn,
  type UseCollaborationOptions,
} from '@/hooks/use-collaboration'

const CollaborationContext = createContext<UseCollaborationReturn | null>(null)

interface CollaborationProviderProps extends UseCollaborationOptions {
  children: ReactNode
}

/**
 * Provides a single shared collaboration connection to all child components.
 * Wrap the editor page content with this to avoid duplicate socket connections.
 */
export function CollaborationProvider({
  children,
  ...options
}: CollaborationProviderProps) {
  const collaboration = useCollaboration(options)

  return (
    <CollaborationContext.Provider value={collaboration}>
      {children}
    </CollaborationContext.Provider>
  )
}

/**
 * Access the shared collaboration state from the provider.
 * Returns null if not inside a CollaborationProvider.
 */
export function useCollaborationContext(): UseCollaborationReturn | null {
  return useContext(CollaborationContext)
}
