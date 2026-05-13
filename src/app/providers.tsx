'use client'

import { AuthProvider } from '@/lib/auth'
import { ToastProvider } from '@/components/ui/toast'
import { I18nProvider } from '@/lib/i18n'
import { ThemeProvider } from '@/lib/theme'
import { HealthCheckProvider } from '@/components/health-check'
import { AnalyticsProvider } from '@/lib/analytics'
import { CookieConsent } from '@/components/cookie-consent'
import { ApiErrorDetailsDialog } from '@/components/modals/api-error-details-dialog'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AnalyticsProvider>
          <AuthProvider>
            <HealthCheckProvider>{children}</HealthCheckProvider>
            <ToastProvider placement="bottom end" />
            <ApiErrorDetailsDialog />
          </AuthProvider>
          <CookieConsent />
        </AnalyticsProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
