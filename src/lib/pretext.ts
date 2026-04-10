'use client'

import {
  prepare,
  prepareWithSegments,
  layout,
  layoutWithLines,
  measureNaturalWidth,
  clearCache,
  setLocale,
  type PreparedText,
  type PreparedTextWithSegments,
  type PrepareOptions,
  type LayoutResult,
  type LayoutLinesResult,
} from '@chenglou/pretext'

import {
  prepareRichInline,
  measureRichInlineStats,
  type RichInlineItem,
  type PreparedRichInline,
} from '@chenglou/pretext/rich-inline'

// ── A4 dimensions at 96 DPI (CSS pixels) ─────────────────
// Our A4Sheet uses aspectRatio: 210/297 with max-w-[960px]
// Inner content: px-10 py-8 → padding 40px L/R, 32px T/B
export const A4_WIDTH_PX = 960
export const A4_CONTENT_WIDTH_PX = A4_WIDTH_PX - 80
export const A4_HEIGHT_PX = Math.round(960 * (297 / 210))
export const A4_CONTENT_HEIGHT_PX = A4_HEIGHT_PX - 64

// ── Font presets used throughout FactorPro ────────────────
const DOCUMENT_FONTS: Record<string, string> = {
  default: "'Lexend', 'Segoe UI', sans-serif",
  lexend: "'Lexend', 'Segoe UI', sans-serif",
  inter: "'Inter', sans-serif",
  lato: "'Lato', sans-serif",
  roboto: "'Roboto', sans-serif",
  georgia: "'Georgia', serif",
  serif: "'Georgia', serif",
  sans: "'Arial', sans-serif",
  mono: "'Courier New', monospace",
}

// ── Font size presets matching a4-sheet.tsx ────────────────
export const FONT_SIZES = {
  'xs':  9,   // text-[9px]  — footer, labels
  'sm':  10,  // text-[10px] — VAT, subtotals
  'md':  11,  // text-[11px] — notes, conditions
  'base': 12, // text-[12px] — body, descriptions
  'lg':  13,  // text-[13px] — company name, total
  'xl':  14,  // text-[14px] — classique title
  'xxl': 18,  // text-[18px] — banner title
} as const

export type FontSizeKey = keyof typeof FONT_SIZES

// ── Helpers ───────────────────────────────────────────────

function resolveFontSize(fontSize: number | FontSizeKey): number {
  return typeof fontSize === 'string' ? FONT_SIZES[fontSize] : fontSize
}

export function resolveFont(fontName?: string): string {
  if (!fontName) return DOCUMENT_FONTS.default
  const key = fontName.toLowerCase().replace(/\s/g, '')
  return DOCUMENT_FONTS[key] || `'${fontName}', 'Segoe UI', sans-serif`
}

function stripFormatting(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/\{color:[^}]+\}(.+?)\{\/color\}/g, '$1')
    .replace(/\{bg:[^}]+\}(.+?)\{\/bg\}/g, '$1')
    .replace(/\{size:\w+\}(.+?)\{\/size\}/g, '$1')
    .replace(/\{font:[^}]+\}(.+?)\{\/font\}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^## /gm, '')
    .replace(/^- /gm, '')
}

// ── Core measurement functions ────────────────────────────

/**
 * Fast text measurement: line count + total height.
 * Uses `prepare` + `layout` (the fastest path).
 */
export function measureTextBlock(
  text: string,
  font: string,
  fontSize: number | FontSizeKey = 'base',
  lineHeight: number = 1.6,
  maxWidth: number = A4_CONTENT_WIDTH_PX,
): { lines: number; height: number } {
  if (!text || text.trim().length === 0) return { lines: 0, height: 0 }
  const size = resolveFontSize(fontSize)
  const stripped = stripFormatting(text)
  const prepared = prepare(stripped, `${size}px ${font}`)
  const result = layout(prepared, maxWidth, size * lineHeight)
  return { lines: result.lineCount, height: result.height }
}

/**
 * Detailed line-by-line layout (text content, width per line).
 * Uses `prepareWithSegments` + `layoutWithLines`.
 */
export function measureTextLines(
  text: string,
  font: string,
  fontSize: number | FontSizeKey = 'base',
  lineHeight: number = 1.6,
  maxWidth: number = A4_CONTENT_WIDTH_PX,
): LayoutLinesResult & { lines: LayoutLinesResult['lines'] } {
  if (!text || text.trim().length === 0) {
    return { lineCount: 0, height: 0, lines: [] }
  }
  const size = resolveFontSize(fontSize)
  const stripped = stripFormatting(text)
  const prepared = prepareWithSegments(stripped, `${size}px ${font}`)
  return layoutWithLines(prepared, maxWidth, size * lineHeight)
}

/**
 * Natural (unconstrained) width of a text string.
 * Uses `prepareWithSegments` + `measureNaturalWidth`.
 */
export function measureTextWidth(
  text: string,
  font: string,
  fontSize: number | FontSizeKey = 'base',
): number {
  if (!text) return 0
  const size = resolveFontSize(fontSize)
  const stripped = stripFormatting(text)
  const prepared = prepareWithSegments(stripped, `${size}px ${font}`)
  return measureNaturalWidth(prepared)
}

// ── Rich inline measurement (mixed fonts/sizes) ──────────

/**
 * Measure rich (formatted) text with mixed fonts/sizes.
 * Useful for descriptions with bold, italic, etc.
 */
export function measureRichText(
  items: RichInlineItem[],
  maxWidth: number = A4_CONTENT_WIDTH_PX,
): { lineCount: number; maxLineWidth: number } {
  if (items.length === 0) return { lineCount: 0, maxLineWidth: 0 }
  const prepared = prepareRichInline(items)
  return measureRichInlineStats(prepared, maxWidth)
}

/**
 * Build RichInlineItem array from markdown-formatted text.
 * Parses **bold**, *italic*, {font:X}...{/font} etc.
 */
export function parseRichInlineItems(
  text: string,
  baseFont: string,
  baseFontSize: number | FontSizeKey = 'base',
): RichInlineItem[] {
  const size = resolveFontSize(baseFontSize)
  const fontStr = `${size}px ${baseFont}`
  const boldFontStr = `bold ${size}px ${baseFont}`
  const italicFontStr = `italic ${size}px ${baseFont}`

  const items: RichInlineItem[] = []
  // Simple parser: split on bold/italic markers
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)

  for (const part of parts) {
    if (!part) continue
    if (part.startsWith('**') && part.endsWith('**')) {
      items.push({ text: part.slice(2, -2), font: boldFontStr })
    } else if (part.startsWith('*') && part.endsWith('*')) {
      items.push({ text: part.slice(1, -1), font: italicFontStr })
    } else {
      items.push({ text: part, font: fontStr })
    }
  }

  return items
}

// ── Document overflow estimation ──────────────────────────

export function estimateDocumentContentHeight(params: {
  lines: { description: string; type: 'standard' | 'section' }[]
  notes?: string
  acceptanceConditions?: string
  freeField?: string
  footerText?: string
  font?: string
  billingType?: 'quick' | 'detailed'
}): {
  totalHeight: number
  overflows: boolean
  overflow: number
  sections: Record<string, number>
} {
  const font = resolveFont(params.font)
  const sections: Record<string, number> = {}
  let totalHeight = 0

  // Header area (company + client + title) ~200px
  sections.header = 200
  totalHeight += 200

  // Subject line ~25px
  sections.subject = 25
  totalHeight += 25

  // Table header ~30px
  sections.tableHeader = 30
  totalHeight += 30

  // Line items
  let linesHeight = 0
  for (const line of params.lines) {
    if (line.type === 'section') {
      linesHeight += 28
    } else {
      const desc = measureTextBlock(line.description, font, 'base', 1.6, A4_CONTENT_WIDTH_PX - 200)
      linesHeight += Math.max(32, desc.height + 16)
    }
  }
  sections.lines = linesHeight
  totalHeight += linesHeight

  // Totals area ~100px
  sections.totals = 100
  totalHeight += 100

  // Notes
  if (params.notes) {
    const h = measureTextBlock(params.notes, font, 'md', 1.6).height + 30
    sections.notes = h
    totalHeight += h
  }

  // Acceptance conditions
  if (params.acceptanceConditions) {
    const h = measureTextBlock(params.acceptanceConditions, font, 'md', 1.6).height + 25
    sections.acceptanceConditions = h
    totalHeight += h
  }

  // Free field
  if (params.freeField) {
    const h = measureTextBlock(params.freeField, font, 'md', 1.6).height + 25
    sections.freeField = h
    totalHeight += h
  }

  // Footer
  if (params.footerText) {
    const h = measureTextBlock(params.footerText, font, 'xs', 1.6).height + 20
    sections.footer = h
    totalHeight += h
  } else {
    sections.footer = 40
    totalHeight += 40
  }

  const overflow = totalHeight - A4_CONTENT_HEIGHT_PX
  return {
    totalHeight,
    overflows: overflow > 0,
    overflow: Math.max(0, overflow),
    sections,
  }
}

// ── Re-exports ────────────────────────────────────────────
export {
  prepare,
  prepareWithSegments,
  layout,
  layoutWithLines,
  measureNaturalWidth,
  clearCache,
  setLocale,
  prepareRichInline,
  measureRichInlineStats,
}
export type {
  PreparedText,
  PreparedTextWithSegments,
  PrepareOptions,
  LayoutResult,
  LayoutLinesResult,
  RichInlineItem,
  PreparedRichInline,
}
