'use client'

import dynamic from 'next/dynamic'

const DarkVeil = dynamic(() => import('@/components/ui/dark-veil'), { ssr: false })

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Shader background */}
      <div className="fixed inset-0 z-0">
        <DarkVeil
          speed={0.3}
          hueShift={200}
          noiseIntensity={0.02}
          scanlineIntensity={0}
          warpAmount={0.3}
          resolutionScale={0.5}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col text-white">
        {/* Header */}
        <header className="flex items-center justify-center py-6">
          <span className="text-xl font-bold tracking-tight text-white drop-shadow-lg">Faktur</span>
        </header>

        {/* Main */}
        <main className="flex-1 flex items-start justify-center px-4 pb-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-4 text-center">
          <p className="text-[11px] text-zinc-500">
            Propulsé par{' '}
            <a
              href="https://fakturapp.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              Faktur
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
