import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/v1'

export function middleware(request: NextRequest) {
  const rawPath = new URL(request.url).pathname

  if (
    request.nextUrl.basePath ||
    rawPath === BASE_PATH ||
    rawPath.startsWith(`${BASE_PATH}/`)
  ) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = `${BASE_PATH}${rawPath === '/' ? '' : rawPath}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/|avatars/|company-logos/|team-icons/|invoice-logos/|.*\\.[^/]+$).*)'],
}
