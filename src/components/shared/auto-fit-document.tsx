'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

interface AutoFitDocumentProps {
  /** Fixed reference width the child is rendered at (px). */
  baseWidth: number
  children: ReactNode
}

// Renders its child at a fixed reference width and scales the whole thing down
// with a CSS transform to fit the available space. The document layout stays
// pixel-identical to the real PDF whatever the viewport size — so anything that
// measures the content (page-overflow detection) sees the true A4 dimensions.
export function AutoFitDocument({ baseWidth, children }: AutoFitDocumentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [size, setSize] = useState({ w: baseWidth, h: 0 })

  useLayoutEffect(() => {
    const container = containerRef.current
    const inner = innerRef.current
    if (!container || !inner) return

    function fit() {
      if (!container || !inner) return
      const availW = container.clientWidth
      const availH = container.clientHeight
      const naturalW = inner.offsetWidth
      const naturalH = inner.offsetHeight
      if (naturalW <= 0 || naturalH <= 0 || availW <= 0 || availH <= 0) return
      const s = Math.min(availW / naturalW, availH / naturalH, 1)
      setScale(s)
      setSize({ w: naturalW * s, h: naturalH * s })
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(container)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [baseWidth])

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-hidden">
      <div style={{ width: size.w, height: size.h }}>
        <div
          ref={innerRef}
          style={{ width: baseWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
