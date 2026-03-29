import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-md mx-auto">
        <div className="text-[120px] font-black leading-none text-foreground/10 select-none">
          404
        </div>
        <h1 className="text-2xl font-bold text-foreground mt-2">Page introuvable</h1>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          La page que vous cherchez n&apos;existe pas ou a ete deplacee.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Page d&apos;accueil
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
