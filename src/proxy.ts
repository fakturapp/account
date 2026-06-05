import { NextResponse, type NextRequest } from 'next/server'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/v1'
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

function ensureBasePath(request: NextRequest) {
  const rawPath = new URL(request.url).pathname

  if (
    request.nextUrl.basePath ||
    rawPath === BASE_PATH ||
    rawPath.startsWith(`${BASE_PATH}/`) ||
    rawPath.startsWith('/_next') ||
    rawPath.startsWith('/avatars') ||
    rawPath.startsWith('/company-logos') ||
    rawPath.startsWith('/team-icons') ||
    rawPath.startsWith('/invoice-logos') ||
    /\.[^/]+$/.test(rawPath)
  ) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = `${BASE_PATH}${rawPath === '/' ? '' : rawPath}`
  return NextResponse.redirect(url)
}

export function proxy(request: NextRequest) {
  const checkoutHost = getHostname(process.env.NEXT_PUBLIC_CHECKOUT_URL)
  const requestHost = request.headers.get('host')?.split(':')[0]?.toLowerCase()

  if (checkoutHost && requestHost === checkoutHost) {
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL
    const { pathname, search } = request.nextUrl

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

    const shortMatch = pathname.match(TOKEN_PATH)
    if (shortMatch) {
      const url = request.nextUrl.clone()
      url.pathname = `/checkout/${shortMatch[1]}/pay`
      return NextResponse.rewrite(url)
    }

    if (LEGACY_CHECKOUT_PATH.test(pathname)) {
      return NextResponse.next()
    }

    if (frontendUrl) {
      try {
        const target = new URL(pathname + search, frontendUrl)
        return NextResponse.redirect(target, 308)
      } catch {}
    }
    return NextResponse.redirect(new URL('https://fakturapp.cc'), 308)
  }

  return ensureBasePath(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
