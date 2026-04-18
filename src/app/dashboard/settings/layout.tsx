'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { SaveBar } from '@/components/ui/save-bar'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { saving, saveError, hasChanges, save, resetChanges } = useInvoiceSettings()
  const showInvoiceSaveBar = !pathname.startsWith('/dashboard/settings/company')

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {showInvoiceSaveBar && (
        <SaveBar
          hasChanges={hasChanges}
          saving={saving}
          error={saveError}
          onSave={save}
          onReset={resetChanges}
        />
      )}
    </>
  )
}
