import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ZenVoice - Free Invoicing & Quoting',
  description: 'Professional invoicing and quoting software, 100% free.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
