'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { Palette } from '@/components/ui/icons'
import {
  CUSTOM_BACKGROUND_ID,
  DEFAULT_BACKGROUND_THEME,
  loadBackgroundSettings,
  saveBackgroundSettings,
} from '@/lib/background-themes'
import {
  UI_ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  DEFAULT_BACKGROUND_INTENSITY,
  DEFAULT_CUSTOM_BLUR,
  DEFAULT_CUSTOM_DIM,
  DEFAULT_SURFACE,
  DEFAULT_SURFACE_OPACITY,
  DEFAULT_SURFACE_BLUR,
  applyAccent,
  applySurface,
  readThemeCookie,
  serializeUiTheme,
  writeThemeCookie,
  type SurfaceStyle,
  type UiTheme,
} from '@/lib/ui-theme'
import {
  ThemeStudioModal,
  BackgroundThumb,
  findMatchingPreset,
  thumbVariant,
  type ThemeDraft,
} from '@/components/settings/theme-studio-modal'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export default function InterfaceSettingsPage() {
  const { toast } = useToast()
  const { theme: mode, setTheme: setMode } = useTheme()
  const [accent, setAccent] = useState<string>(DEFAULT_ACCENT)
  const [background, setBackground] = useState<string>(DEFAULT_BACKGROUND_THEME)
  const [intensity, setIntensity] = useState<number>(DEFAULT_BACKGROUND_INTENSITY)
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const [customBlur, setCustomBlur] = useState<number>(DEFAULT_CUSTOM_BLUR)
  const [customDim, setCustomDim] = useState<number>(DEFAULT_CUSTOM_DIM)
  const [surface, setSurface] = useState<SurfaceStyle>(DEFAULT_SURFACE)
  const [surfaceOpacity, setSurfaceOpacity] = useState<number>(DEFAULT_SURFACE_OPACITY)
  const [surfaceBlur, setSurfaceBlur] = useState<number>(DEFAULT_SURFACE_BLUR)
  const [uploading, setUploading] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    const settings = loadBackgroundSettings()
    setBackground(settings.themeId)
    setIntensity(settings.intensity)
    setCustomUrl(settings.customUrl)
    setCustomBlur(settings.customBlur)
    setCustomDim(settings.customDim)
    const cookieTheme = readThemeCookie()
    if (cookieTheme) {
      setAccent(cookieTheme.accent ?? DEFAULT_ACCENT)
      setSurface(cookieTheme.surface)
      setSurfaceOpacity(cookieTheme.surfaceOpacity)
      setSurfaceBlur(cookieTheme.surfaceBlur)
    } else {
      try {
        const cached = localStorage.getItem(UI_ACCENT_STORAGE_KEY)
        if (cached) setAccent(cached)
      } catch {}
    }
  }, [])

  const buildTheme = useCallback(
    (patch: Partial<UiTheme> = {}): UiTheme => ({
      mode,
      accent,
      background,
      backgroundIntensity: intensity,
      customBackgroundUrl: customUrl,
      customBlur,
      customDim,
      surface,
      surfaceOpacity,
      surfaceBlur,
      ...patch,
    }),
    [
      mode,
      accent,
      background,
      intensity,
      customUrl,
      customBlur,
      customDim,
      surface,
      surfaceOpacity,
      surfaceBlur,
    ]
  )

  const persist = (theme: UiTheme) => {
    writeThemeCookie(theme)
    api.put('/account/ui-theme', { theme: serializeUiTheme(theme) })
  }

  const syncBackground = (theme: UiTheme) => {
    saveBackgroundSettings({
      themeId: theme.background ?? DEFAULT_BACKGROUND_THEME,
      intensity: theme.backgroundIntensity,
      customUrl: theme.customBackgroundUrl,
      customBlur: theme.customBlur,
      customDim: theme.customDim,
    })
  }

  const uploadCustom = async (file: File): Promise<string | null> => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast('Image trop lourde : 8 Mo maximum', 'error')
      return null
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('background', file)
    const { data, error } = await api.upload<{ backgroundUrl: string }>(
      '/account/ui-background',
      formData
    )
    setUploading(false)
    if (error || !data?.backgroundUrl) {
      toast(error || "Impossible d'importer cette image", 'error')
      return null
    }
    setCustomUrl(data.backgroundUrl)
    setBackground(CUSTOM_BACKGROUND_ID)
    const theme = buildTheme({
      background: CUSTOM_BACKGROUND_ID,
      customBackgroundUrl: data.backgroundUrl,
    })
    syncBackground(theme)
    persist(theme)
    toast('Fond personnalisé importé', 'success')
    return data.backgroundUrl
  }

  const removeCustom = async () => {
    const { error } = await api.delete('/account/ui-background')
    if (error) {
      toast(error, 'error')
      return
    }
    setCustomUrl(null)
    const nextBackground = background === CUSTOM_BACKGROUND_ID ? DEFAULT_BACKGROUND_THEME : background
    setBackground(nextBackground)
    const theme = buildTheme({ background: nextBackground, customBackgroundUrl: null })
    syncBackground(theme)
    toast('Fond personnalisé supprimé', 'success')
  }

  const applyWizard = (draft: ThemeDraft) => {
    setMode(draft.mode)
    setAccent(draft.accent)
    applyAccent(draft.accent)
    setBackground(draft.background)
    setIntensity(draft.intensity)
    setCustomBlur(draft.customBlur)
    setCustomDim(draft.customDim)
    setSurface(draft.surface)
    setSurfaceOpacity(draft.surfaceOpacity)
    setSurfaceBlur(draft.surfaceBlur)
    applySurface(draft)
    const theme: UiTheme = {
      mode: draft.mode,
      accent: draft.accent,
      background: draft.background,
      backgroundIntensity: draft.intensity,
      customBackgroundUrl: customUrl,
      customBlur: draft.customBlur,
      customDim: draft.customDim,
      surface: draft.surface,
      surfaceOpacity: draft.surfaceOpacity,
      surfaceBlur: draft.surfaceBlur,
    }
    syncBackground(theme)
    persist(theme)
    setWizardOpen(false)
    toast('Thème appliqué', 'success')
  }

  const currentDraft: ThemeDraft = {
    mode,
    accent,
    background,
    intensity,
    customBlur,
    customDim,
    surface,
    surfaceOpacity,
    surfaceBlur,
  }

  const activePreset = findMatchingPreset(currentDraft)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Interface</h1>
        <p className="text-sm text-muted-foreground">
          Votre thème personnel, synchronisé sur tous vos appareils et sur Faktur
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <BackgroundThumb
              background={background}
              customUrl={customUrl}
              customBlur={customBlur}
              customDim={customDim}
              intensity={intensity}
              forceMode={thumbVariant(mode)}
              className="aspect-[16/10] w-full shrink-0 rounded-xl border border-border/60 sm:w-52"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Thème actuel
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground">
                {activePreset ? activePreset.name : 'Thème personnalisé'}
              </h2>
            </div>
            <Button onClick={() => setWizardOpen(true)} className="shrink-0">
              <Palette className="h-4 w-4" />
              Modifier le thème
            </Button>
          </div>
        </CardContent>
      </Card>

      <ThemeStudioModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initial={currentDraft}
        customUrl={customUrl}
        uploading={uploading}
        onUpload={uploadCustom}
        onRemoveCustom={removeCustom}
        onApply={applyWizard}
      />
    </div>
  )
}
