'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { FilePlus, Sparkles } from 'lucide-react'
import { AiDocumentModal } from '@/components/ai/ai-document-modal'

interface CreateQuoteModalProps {
  open: boolean
  onClose: () => void
}

export function CreateQuoteModal({ open, onClose }: CreateQuoteModalProps) {
  const router = useRouter()
  const [aiModalOpen, setAiModalOpen] = useState(false)

  function handleBlankChoice() {
    onClose()
    router.push('/dashboard/quotes/new')
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} className="max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key="choose"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DialogTitle>Créer un devis</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              Choisissez comment créer votre devis
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleBlankChoice}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/50 hover:bg-card/80 hover:border-primary/30 p-6 transition-all text-center group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <FilePlus className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Devis vierge</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Créer de zéro</p>
                </div>
              </button>

              <button
                onClick={() => { onClose(); setAiModalOpen(true) }}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/50 hover:bg-card/80 hover:border-purple-500/30 p-6 transition-all text-center group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Créer avec l&apos;IA</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Générée par intelligence artificielle</p>
                </div>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </Dialog>

      <AiDocumentModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        type="quote"
      />
    </>
  )
}
