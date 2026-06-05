'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'

const Ferrofluid = dynamic(() => import('@/components/ui/ferrofluid'), { ssr: false })

const HELP_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'https://docs.fakturapp.cc'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="fixed inset-0 z-0 bg-background">
        <Ferrofluid className="h-full w-full" intensity={0.5} />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1] bg-background/30" />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-8 flex items-center gap-2.5">
            <img src="/logo.svg" alt="Faktur" className="h-8 w-8" />
            <span className="text-lg font-bold tracking-[-0.03em] text-foreground">Faktur</span>
          </div>

          {children}
        </motion.div>
      </main>

      <footer className="relative z-10 px-4 pb-7">
        <div className="mx-auto flex max-w-[420px] flex-col items-center gap-4">
          <a
            href={HELP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-foreground backdrop-blur transition-colors hover:bg-surface-hover"
          >
            Aide
          </a>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-secondary">
            <a
              href="/legal/terms"
              target="_blank"
              className="underline underline-offset-2 transition-colors hover:text-muted-foreground"
            >
              CGU
            </a>
            <a
              href="/legal/cookies"
              target="_blank"
              className="underline underline-offset-2 transition-colors hover:text-muted-foreground"
            >
              Cookies
            </a>
            <a
              href="/legal/privacy"
              target="_blank"
              className="underline underline-offset-2 transition-colors hover:text-muted-foreground"
            >
              Confidentialité
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
