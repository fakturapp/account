import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Paiement — Faktur',
  robots: { index: false, follow: false },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c0a13] text-white">
      {/* Header */}
      <header className="flex items-center justify-center py-6">
        <span className="text-xl font-bold tracking-tight text-white">Faktur</span>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 pb-12">
        {children}
      </main>
    </div>
  )
}
