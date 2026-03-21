'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { ShinyText } from '@/components/ui/shiny-text'

interface AiSheetOverlayProps {
  open: boolean
}

export function AiSheetOverlay({ open }: AiSheetOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-20 flex items-center justify-center rounded-xl overflow-hidden"
        >
          {/* Semi-transparent backdrop with blur */}
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

          {/* Center content */}
          <div className="relative flex flex-col items-center">
            {/* Galaxy AI animation */}
            <div className="relative h-24 w-24 mb-5">
              {/* Glow backdrop */}
              <motion.div
                className="absolute -inset-4 rounded-full blur-2xl"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)' }}
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Ring 1 — outermost */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  border: '1.5px solid transparent',
                  background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(135deg, rgba(139,92,246,0.6), rgba(99,102,241,0.1), rgba(59,130,246,0.6)) border-box',
                }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />

              {/* Ring 2 */}
              <motion.div
                className="absolute inset-2 rounded-full"
                style={{
                  border: '1.5px solid transparent',
                  background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(225deg, rgba(236,72,153,0.5), rgba(139,92,246,0.1), rgba(99,102,241,0.5)) border-box',
                }}
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />

              {/* Ring 3 */}
              <motion.div
                className="absolute inset-4 rounded-full"
                style={{
                  border: '1px solid transparent',
                  background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(45deg, rgba(59,130,246,0.6), rgba(139,92,246,0.1), rgba(236,72,153,0.6)) border-box',
                }}
                animate={{ rotate: [0, -360] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              />

              {/* Ring 4 */}
              <motion.div
                className="absolute inset-6 rounded-full"
                style={{
                  border: '1px solid transparent',
                  background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(315deg, rgba(139,92,246,0.5), rgba(236,72,153,0.1), rgba(59,130,246,0.5)) border-box',
                }}
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />

              {/* Inner gradient orb */}
              <motion.div
                className="absolute inset-8 rounded-full"
                animate={{
                  background: [
                    'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)',
                    'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(59,130,246,0.2) 50%, transparent 70%)',
                    'radial-gradient(circle, rgba(236,72,153,0.4) 0%, rgba(139,92,246,0.2) 50%, transparent 70%)',
                    'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(99,102,241,0.2) 50%, transparent 70%)',
                  ],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="h-6 w-6 text-purple-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                </motion.div>
              </div>

              {/* Floating particles */}
              {[...Array(8)].map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180
                const radius = 44 + (i % 3) * 6
                const size = 1.5 + (i % 3) * 0.5
                const colors = ['bg-purple-400/70', 'bg-indigo-400/70', 'bg-blue-400/70', 'bg-pink-400/70']
                return (
                  <motion.div
                    key={i}
                    className={`absolute rounded-full ${colors[i % colors.length]}`}
                    style={{ width: size, height: size, top: '50%', left: '50%' }}
                    animate={{
                      x: [0, Math.cos(angle) * radius, Math.cos(angle + 0.5) * (radius * 0.6), 0],
                      y: [0, Math.sin(angle) * radius, Math.sin(angle + 0.5) * (radius * 0.6), 0],
                      opacity: [0, 0.8, 1, 0],
                      scale: [0, 1.2, 0.8, 0],
                    }}
                    transition={{
                      duration: 2.5 + (i % 3) * 0.5,
                      repeat: Infinity,
                      delay: i * 0.25,
                      ease: 'easeInOut',
                    }}
                  />
                )
              })}
            </div>

            {/* Shiny text */}
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ShinyText
                text="Modification en cours..."
                className="text-base font-semibold"
                color="#a78bfa"
                shineColor="#e0e7ff"
                speed={1.5}
              />
            </motion.div>

            {/* Indeterminate progress bar */}
            <div className="w-36 h-1 rounded-full bg-muted/30 mt-4 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, rgba(139,92,246,0.8), rgba(99,102,241,0.8), rgba(59,130,246,0.8), rgba(236,72,153,0.8))',
                  backgroundSize: '200% 100%',
                }}
                animate={{
                  x: ['-100%', '200%'],
                  backgroundPosition: ['0% 0%', '100% 0%'],
                }}
                transition={{
                  x: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                  backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
