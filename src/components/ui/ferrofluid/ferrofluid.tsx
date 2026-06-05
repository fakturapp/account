'use client'

import { useEffect, useRef } from 'react'

interface FerrofluidProps {
  className?: string
  intensity?: number
}

function Ferrofluid({ className, intensity = 0.5 }: FerrofluidProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let raf = 0

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setSize()
    window.addEventListener('resize', setSize)

    const blobs = Array.from({ length: 5 }, () => ({
      ox: Math.random(),
      oy: Math.random(),
      r: 0.32 + Math.random() * 0.24,
      ax: 0.1 + Math.random() * 0.12,
      ay: 0.1 + Math.random() * 0.12,
      fx: 0.2 + Math.random() * 0.3,
      fy: 0.2 + Math.random() * 0.3,
      ph: Math.random() * Math.PI * 2,
      hue: 248 + Math.random() * 36,
    }))

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      const tt = t * 0.00022
      for (const b of blobs) {
        const cx = (b.ox + Math.cos(tt * b.fx + b.ph) * b.ax) * w
        const cy = (b.oy + Math.sin(tt * b.fy + b.ph) * b.ay) * h
        const rad = b.r * Math.min(w, h)
        const a = 0.09 * intensity
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
        g.addColorStop(0, `hsla(${b.hue}, 72%, 56%, ${a})`)
        g.addColorStop(1, `hsla(${b.hue}, 72%, 56%, 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx, cy, rad, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    if (reduce) {
      draw(0)
    } else {
      const loop = (now: number) => {
        draw(now)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', setSize)
    }
  }, [intensity])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}

export { Ferrofluid }
export default Ferrofluid
