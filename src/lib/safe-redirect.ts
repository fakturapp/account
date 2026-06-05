const DASH_URL = process.env.NEXT_PUBLIC_DASH_URL || ''

function isAllowedHost(host: string): boolean {
  const lower = host.toLowerCase()
  return (
    lower === 'fakturapp.cc' ||
    lower.endsWith('.fakturapp.cc') ||
    lower === 'localhost' ||
    lower.startsWith('localhost:') ||
    lower === '127.0.0.1' ||
    lower.startsWith('127.0.0.1:')
  )
}

export function resolvePostAuthRedirect(rawRedirect?: string | null): string {
  if (rawRedirect) {
    if (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) {
      return rawRedirect
    }
    try {
      const url = new URL(rawRedirect)
      if ((url.protocol === 'https:' || url.protocol === 'http:') && isAllowedHost(url.host)) {
        return url.toString()
      }
    } catch {}
  }
  return DASH_URL || '/'
}
