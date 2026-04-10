'use client'

import { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useTutorial } from '@/lib/tutorial-context'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, SkipForward, Wand2 } from 'lucide-react'
import type { TutorialHighlight } from '@/components/tutorial/tutorial-steps'

interface Rect { top: number; left: number; width: number; height: number }

function getRect(el: Element): Rect {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

export function TutorialOverlay() {
  const {
    active, currentStep, currentLevel, step, totalStepsInLevel, level,
    nextStep, prevStep, skipLevel, showLevelComplete, showTutorialComplete, showOffer,
  } = useTutorial()
  const pathname = usePathname()

  const [ready, setReady] = useState(false)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [highlightRects, setHighlightRects] = useState<(Rect & { label: string; pos: string })[]>([])
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })

  // Wait for page to load + target element to appear
  useEffect(() => {
    if (!active || !currentStep) { setReady(false); return }
    if (showLevelComplete || showTutorialComplete || showOffer) { setReady(false); return }

    // If step has a route, wait for pathname match
    if (currentStep.route && pathname !== currentStep.route) { setReady(false); return }

    let cancelled = false
    let attempts = 0

    function tryResolve() {
      if (cancelled) return

      // Check main target
      if (currentStep!.target) {
        const el = document.querySelector(currentStep!.target)
        if (!el && attempts < 40) { attempts++; setTimeout(tryResolve, 100); return }
        if (el) setTargetRect(getRect(el)); else setTargetRect(null)
      } else {
        setTargetRect(null)
      }

      // Check highlights
      if (currentStep!.highlights?.length) {
        const found: (Rect & { label: string; pos: string })[] = []
        for (const h of currentStep!.highlights!) {
          const el = document.querySelector(h.target)
          if (el) found.push({ ...getRect(el), label: h.label, pos: h.position || 'right' })
        }
        setHighlightRects(found)
      } else {
        setHighlightRects([])
      }

      setReady(true)
    }

    // Small delay to let the page render
    const timer = setTimeout(tryResolve, 200)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [active, currentStep?.id, pathname, showLevelComplete, showTutorialComplete, showOffer])

  // Track target on scroll/resize
  const updatePositions = useCallback(() => {
    if (!ready || !currentStep) return
    if (currentStep.target) {
      const el = document.querySelector(currentStep.target)
      if (el) setTargetRect(getRect(el))
    }
    if (currentStep.highlights?.length) {
      const found: (Rect & { label: string; pos: string })[] = []
      for (const h of currentStep.highlights) {
        const el = document.querySelector(h.target)
        if (el) found.push({ ...getRect(el), label: h.label, pos: h.position || 'right' })
      }
      setHighlightRects(found)
    }
  }, [ready, currentStep])

  useEffect(() => {
    if (!ready) return
    window.addEventListener('scroll', updatePositions, true)
    window.addEventListener('resize', updatePositions)
    return () => {
      window.removeEventListener('scroll', updatePositions, true)
      window.removeEventListener('resize', updatePositions)
    }
  }, [ready, updatePositions])

  // Position tooltip
  useLayoutEffect(() => {
    if (!ready || !tooltipRef.current) return
    const tt = tooltipRef.current.getBoundingClientRect()
    const pad = 16

    if (!targetRect) {
      setTooltipPos({
        top: Math.max(pad, (window.innerHeight - tt.height) / 2),
        left: Math.max(pad, (window.innerWidth - tt.width) / 2),
      })
      return
    }

    const pos = currentStep?.position ?? 'bottom'
    let top = 0, left = 0
    if (pos === 'bottom') { top = targetRect.top + targetRect.height + 16; left = targetRect.left + targetRect.width / 2 - tt.width / 2 }
    else if (pos === 'top') { top = targetRect.top - tt.height - 16; left = targetRect.left + targetRect.width / 2 - tt.width / 2 }
    else if (pos === 'right') { top = targetRect.top + targetRect.height / 2 - tt.height / 2; left = targetRect.left + targetRect.width + 16 }
    else if (pos === 'left') { top = targetRect.top + targetRect.height / 2 - tt.height / 2; left = targetRect.left - tt.width - 16 }

    top = Math.max(pad, Math.min(top, window.innerHeight - tt.height - pad))
    left = Math.max(pad, Math.min(left, window.innerWidth - tt.width - pad))
    setTooltipPos({ top, left })
  }, [ready, targetRect, currentStep?.id, currentStep?.position])

  if (!active || !currentStep || !ready) return null
  if (showLevelComplete || showTutorialComplete || showOffer) return null

  const pad = 8

  return (
    <>
      {/* Dark overlay */}
      <motion.div
        key="tutorial-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9990] bg-black/50 pointer-events-none"
      />

      {/* Spotlight cutout */}
      {currentStep.spotlight && targetRect && (
        <motion.div
          key={`spot-${currentStep.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed z-[9991] rounded-xl pointer-events-none"
          style={{
            top: targetRect.top - pad, left: targetRect.left - pad,
            width: targetRect.width + pad * 2, height: targetRect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          }}
        />
      )}

      {/* Highlight labels */}
      {highlightRects.map((h, i) => (
        <motion.div
          key={`hl-${i}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.08 }}
          className="fixed z-[9993] pointer-events-none flex items-center gap-2"
          style={{
            top: h.pos === 'bottom' ? h.top + h.height + 6 : h.pos === 'top' ? h.top - 30 : h.top + h.height / 2 - 12,
            left: h.pos === 'left' ? h.left - 8 : h.pos === 'right' ? h.left + h.width + 8 : h.left + h.width / 2,
            transform: h.pos === 'left' ? 'translateX(-100%)' : h.pos === 'top' || h.pos === 'bottom' ? 'translateX(-50%)' : undefined,
          }}
        >
          {/* Connector dot */}
          <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          {/* Label */}
          <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-white whitespace-nowrap shadow-lg">
            {h.label}
          </span>
        </motion.div>
      ))}

      {/* Highlight frames */}
      {highlightRects.map((h, i) => (
        <motion.div
          key={`frame-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 + i * 0.08 }}
          className="fixed z-[9992] pointer-events-none rounded-lg border-2 border-accent/50 border-dashed"
          style={{ top: h.top - 4, left: h.left - 4, width: h.width + 8, height: h.height + 8 }}
        />
      ))}

      {/* Click blocker */}
      <div className="fixed inset-0 z-[9994]" onClick={(e) => e.stopPropagation()} />

      {/* Tooltip */}
      <motion.div
        ref={tooltipRef}
        key={`tt-${currentStep.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed z-[9995] w-[360px] max-w-[calc(100vw-32px)]"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className="rounded-2xl bg-overlay shadow-2xl border border-border/20 overflow-hidden">
          {/* Level bar */}
          <div
            className="px-4 py-2 flex items-center justify-between text-xs font-semibold"
            style={{ backgroundColor: `${currentLevel?.color}12`, color: currentLevel?.color }}
          >
            <span>Niveau {level} · {currentLevel?.name}</span>
            <span className="text-muted-foreground font-normal">{step + 1}/{totalStepsInLevel}</span>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-1.5">{currentStep.title}</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{currentStep.description}</p>

            {currentStep.prefill && (
              <button
                type="button"
                className="mt-3 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent/15"
                onClick={() => window.dispatchEvent(new CustomEvent('tutorial:prefill', { detail: { type: currentStep.prefill } }))}
              >
                <Wand2 className="h-3.5 w-3.5" />
                Préremplir
              </button>
            )}
          </div>

          {/* Dots */}
          <div className="px-4 pb-2.5 flex items-center justify-center gap-1">
            {Array.from({ length: totalStepsInLevel }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i === step ? 'w-5 bg-accent' : i < step ? 'w-1.5 bg-accent/40' : 'w-1.5 bg-muted-foreground/15'
                )}
              />
            ))}
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between border-t border-border/10 px-3 py-2.5">
            <button
              type="button" onClick={prevStep} disabled={level === 1 && step === 0}
              className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Précédent
            </button>
            <button
              type="button" onClick={skipLevel}
              className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <SkipForward className="h-3 w-3" /> Passer
            </button>
            <button
              type="button" onClick={nextStep}
              className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-accent/90 transition-colors"
            >
              {step === totalStepsInLevel - 1 ? 'Terminer' : 'Suivant'}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
