/**
 * Detect whether the current browser session is running inside the
 * Faktur Desktop Electron shell. The shell stamps `FakturDesktop/<v>`
 * onto the default Chromium user-agent and also sets a flag via the
 * preload's contextBridge — we check both because the preload may
 * arrive slightly after the first React render on a cold boot.
 */

export function isFakturDesktop(): boolean {
  if (typeof window === 'undefined') return false

  // Stamp from the Electron main-process preload
  const bridgeFlag =
    typeof (window as any).fakturDesktop === 'object' &&
    (window as any).fakturDesktop?.isDesktop === true
  if (bridgeFlag) return true

  // Fallback: user-agent stamp set by shell_window.js
  const ua = window.navigator?.userAgent ?? ''
  if (/FakturDesktop\/\d+/i.test(ua)) return true

  // Belt and braces: the shell bootstrap script writes this flag in
  // localStorage before the first React render on every navigation.
  try {
    if (window.localStorage?.getItem('faktur_source') === 'desktop') return true
  } catch {
    /* ignore — localStorage may be blocked */
  }

  return false
}
