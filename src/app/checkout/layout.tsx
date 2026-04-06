'use client'

import { useState, useEffect } from 'react'

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('checkout_theme')
    if (saved === 'light') setDark(false)
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    localStorage.setItem('checkout_theme', next ? 'dark' : 'light')
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${dark ? 'dark bg-zinc-950 text-white' : 'bg-[#f8f8f8] text-zinc-900'}`}>
      {/* Main — centré verticalement et horizontalement */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {/* Faktur centered */}
        <p className={`text-lg font-bold tracking-tight mb-8 ${dark ? 'text-white' : 'text-zinc-900'}`}>
          Faktur
        </p>

        <div className="w-full max-w-[440px]">
          {children}
        </div>

        {/* Footer inline */}
        <div className="mt-8 flex items-center gap-3">
          <p className={`text-[11px] ${dark ? 'text-white/20' : 'text-zinc-400'}`}>
            Propulsé par{' '}
            <a
              href="https://fakturapp.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:text-indigo-400 transition-colors font-medium"
            >
              Faktur
            </a>
          </p>
          <span className={`text-[11px] ${dark ? 'text-white/10' : 'text-zinc-300'}`}>·</span>
          <button
            onClick={toggleTheme}
            className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${dark ? 'text-white/20 hover:text-white/50' : 'text-zinc-400 hover:text-zinc-600'}`}
            title={dark ? 'Thème clair' : 'Thème sombre'}
          >
            {dark ? (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
