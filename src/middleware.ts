import { NextResponse, type NextRequest } from 'next/server'

/**
 * Hostname-based routing for the dedicated checkout subdomain.
 *
 * Required env vars:
 * - NEXT_PUBLIC_CHECKOUT_URL  e.g. https://checkout.fakturapp.cc
 * - NEXT_PUBLIC_FRONTEND_URL  e.g. https://app.fakturapp.cc
 *
 * Behaviour:
 * - On the checkout host, the only valid public path is `/<token>/pay`. The
 *   request is rewritten internally to `/checkout/<token>/pay` so the existing
 *   Next.js route handles it. The legacy `/checkout/<token>/pay` URL is also
 *   accepted for backwards compatibility.
 * - Any other path on the checkout host is redirected to the dashboard host
 *   (NEXT_PUBLIC_FRONTEND_URL).
 * - Requests on other hosts are passed through untouched.
 */

const TOKEN_PATH = /^\/([^/]+)\/pay\/?$/
const LEGACY_CHECKOUT_PATH = /^\/checkout\/([^/]+)\/pay\/?$/

function getHostname(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const checkoutHost = getHostname(process.env.NEXT_PUBLIC_CHECKOUT_URL)
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL

  // No checkout subdomain configured → nothing to do.
  if (!checkoutHost) {
    return NextResponse.next()
  }

  const requestHost = request.headers.get('host')?.split(':')[0]?.toLowerCase()
  if (requestHost !== checkoutHost) {
    return NextResponse.next()
  }

  const { pathname, search } = request.nextUrl

  // Allow Next.js internals & static assets even on the checkout host.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/avatars') ||
    pathname.startsWith('/company-logos') ||
    pathname.startsWith('/team-icons') ||
    pathname.startsWith('/invoice-logos') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  // Short form `/<token>/pay` → rewrite to the actual Next.js route.
  const shortMatch = pathname.match(TOKEN_PATH)
  if (shortMatch) {
    const url = request.nextUrl.clone()
    url.pathname = `/checkout/${shortMatch[1]}/pay`
    return NextResponse.rewrite(url)
  }

  // Legacy long form `/checkout/<token>/pay` → keep it working.
  if (LEGACY_CHECKOUT_PATH.test(pathname)) {
    return NextResponse.next()
  }

  // Anything else on the checkout host → bounce to the dashboard.
  if (frontendUrl) {
    try {
      const target = new URL(pathname + search, frontendUrl)
      return NextResponse.redirect(target, 308)
    } catch {
      // fall through
    }
  }
  return NextResponse.redirect(new URL('https://fakturapp.cc'), 308)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
