'use client'

import dynamic from 'next/dynamic'

const DarkVeil = dynamic(() => import('@/components/ui/dark-veil'), { ssr: false })

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Shader background with fallback gradient */}
      <div className="fixed inset-0 z-0" style={{ width: '100vw', height: '100vh' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-[#0a0a0f] to-violet-950/40" />
        <div className="absolute inset-0">
          <DarkVeil
            speed={0.25}
            hueShift={220}
            noiseIntensity={0.015}
            scanlineIntensity={0}
            warpAmount={0.2}
            resolutionScale={0.4}
          />
        </div>
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8" />
                <path d="M8 17h8" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Faktur</span>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex items-start justify-center px-4 pb-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-5 text-center">
          <p className="text-[11px] text-white/20">
            Propulsé par{' '}
            <a
              href="https://fakturapp.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400/60 hover:text-indigo-400 transition-colors font-medium"
            >
              Faktur
            </a>
            {' '}— Facturation simple et sécurisée
          </p>
        </footer>
      </div>
    </div>
  )
}
