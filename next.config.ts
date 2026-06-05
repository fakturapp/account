import type { NextConfig } from 'next'

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/v1'

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  },
]

const nextConfig: NextConfig = {
  basePath,
  reactStrictMode: true,
  experimental: {
    preloadEntriesOnStart: false,
    webpackMemoryOptimizations: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async redirects() {
    const toV1 = [
      '/login',
      '/login/success',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
      '/2fa',
      '/invite/:path*',
      '/oauth/:path*',
      '/settings/:path*',
      '/vault-locked',
    ]
    const base = toV1.map((source) => ({
      source,
      destination: `${basePath}${source}`,
      basePath: false,
      permanent: false,
    }))
    const accountCompat = [
      { source: '/account', destination: `${basePath}/settings`, basePath: false, permanent: false },
      { source: '/account/:path*', destination: `${basePath}/settings/:path*`, basePath: false, permanent: false },
      { source: '/account', destination: '/settings', permanent: false },
      { source: '/account/:path*', destination: '/settings/:path*', permanent: false },
    ]
    return [...base, ...accountCompat]
  },
  async rewrites() {
    return [
      { source: '/avatars/:path*', destination: `${backendUrl}/avatars/:path*` },
      { source: '/company-logos/:path*', destination: `${backendUrl}/company-logos/:path*` },
      { source: '/team-icons/:path*', destination: `${backendUrl}/team-icons/:path*` },
      { source: '/invoice-logos/:path*', destination: `${backendUrl}/invoice-logos/:path*` },
    ]
  },
}

export default nextConfig
