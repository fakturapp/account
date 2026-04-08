'use client'

import { motion, type Variants } from 'framer-motion'
import { useMemo } from 'react'

export interface SplitTextProps {
  text: string
  className?: string
  delay?: number
  duration?: number
  splitType?: 'chars' | 'words'
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
}

export function SplitText({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  splitType = 'chars',
  tag = 'p',
}: SplitTextProps) {
  const items = useMemo(() => {
    if (splitType === 'words') return text.split(/(\s+)/)
    return text.split('')
  }, [text, splitType])

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay / 1000,
        delayChildren: 0,
      },
    },
  }

  const child: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  }

  const Tag = motion[tag] as React.ElementType

  return (
    <Tag
      key={text}
      variants={container}
      initial="hidden"
      animate="visible"
      className={`split-parent inline-block ${className}`}
      style={{ willChange: 'transform, opacity' }}
    >
      {items.map((item, i) => (
        <motion.span
          key={`${item}-${i}`}
          variants={child}
          className="inline-block"
          style={{ whiteSpace: item === ' ' ? 'pre' : undefined }}
        >
          {item === ' ' ? '\u00A0' : item}
        </motion.span>
      ))}
    </Tag>
  )
}

export default SplitText
