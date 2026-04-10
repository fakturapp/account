'use client'

import { motion } from 'framer-motion'
import { useTutorial } from '@/lib/tutorial-context'
import { TUTORIAL_LEVELS, getTotalXp } from '@/components/tutorial/tutorial-steps'
import { GraduationCap, X, Zap } from 'lucide-react'

export function TutorialBanner() {
  const { active, level, step, totalStepsInLevel, earnedXp, currentLevel, quitTutorial } = useTutorial()

  if (!active) return null

  const totalXp = getTotalXp()
  const currentLevelXp = currentLevel?.xp ?? 0
  const stepProgress = totalStepsInLevel > 0 ? (step / totalStepsInLevel) * currentLevelXp : 0
  const displayXp = earnedXp + Math.round(stepProgress)
  const progressPercent = totalXp > 0 ? (displayXp / totalXp) * 100 : 0

  return (
    <motion.div
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -48, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="relative z-50 flex items-center gap-4 border-b border-accent/20 bg-accent/5 px-4 py-2 backdrop-blur-sm"
    >
      {/* Icon */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
          <GraduationCap className="h-4 w-4 text-accent" />
        </div>
        <span className="text-xs font-bold text-accent uppercase tracking-wider">
          Didacticiel
        </span>
      </div>

      {/* Level info */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-foreground">
          Niv. {level}
        </span>
        <span className="text-muted-foreground">
          {currentLevel?.name}
        </span>
        <span className="text-xs text-muted-foreground/60">
          ({step + 1}/{totalStepsInLevel})
        </span>
      </div>

      {/* XP Progress bar */}
      <div className="flex flex-1 items-center gap-2 max-w-xs">
        <Zap className="h-3.5 w-3.5 text-amber-400" />
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {displayXp}/{totalXp} XP
        </span>
      </div>

      {/* Level dots */}
      <div className="hidden md:flex items-center gap-1">
        {TUTORIAL_LEVELS.map((l) => (
          <div
            key={l.id}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              l.id < level
                ? 'bg-accent'
                : l.id === level
                ? 'bg-accent/60 ring-2 ring-accent/30 ring-offset-1 ring-offset-transparent'
                : 'bg-muted-foreground/15'
            }`}
            title={`Niveau ${l.id}: ${l.name}`}
          />
        ))}
      </div>

      {/* Quit */}
      <button
        type="button"
        onClick={quitTutorial}
        className="ml-auto flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <X className="h-3 w-3" />
        Quitter
      </button>
    </motion.div>
  )
}
