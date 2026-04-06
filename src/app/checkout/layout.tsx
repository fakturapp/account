'use client'

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen flex flex-col bg-zinc-950 text-white">
      {/* Header */}
      <header className="py-6 text-center">
        <span className="text-lg font-bold tracking-tight text-white">Faktur</span>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-4">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
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
        </p>
      </footer>
    </div>
  )
}
