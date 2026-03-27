'use client'

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bold, Italic, Underline } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════════
   Markdown ↔ HTML conversion
   ═══════════════════════════════════════════════════════════ */

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Convert markdown string → HTML for contentEditable display */
export function mdToHtml(md: string): string {
  if (!md) return ''
  let html = escHtml(md)
  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Underline: __text__  (must come before italic single _ check)
  html = html.replace(/__(.+?)__/g, '<u>$1</u>')
  // Italic: *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Newlines
  html = html.replace(/\n/g, '<br>')
  return html
}

/** Convert HTML from contentEditable → markdown string */
export function htmlToMd(html: string): string {
  if (!html) return ''
  let md = html
  // Normalize self-closing br
  md = md.replace(/<br\s*\/?>/gi, '\n')
  // Convert formatting tags to markdown
  md = md.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
  md = md.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
  md = md.replace(/<u>([\s\S]*?)<\/u>/gi, '__$1__')
  md = md.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
  md = md.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*')
  // Strip any remaining HTML tags
  md = md.replace(/<[^>]+>/g, '')
  // Decode HTML entities
  md = md.replace(/&amp;/g, '&')
  md = md.replace(/&lt;/g, '<')
  md = md.replace(/&gt;/g, '>')
  md = md.replace(/&quot;/g, '"')
  md = md.replace(/&nbsp;/g, ' ')
  return md
}

/* ═══════════════════════════════════════════════════════════
   FloatingToolbar
   ═══════════════════════════════════════════════════════════ */

interface ToolbarState {
  visible: boolean
  x: number
  y: number
  bold: boolean
  italic: boolean
  underline: boolean
}

function FloatingToolbar({
  state,
  onFormat,
}: {
  state: ToolbarState
  onFormat: (cmd: 'bold' | 'italic' | 'underline') => void
}) {
  const buttons: { cmd: 'bold' | 'italic' | 'underline'; Icon: typeof Bold; active: boolean }[] = [
    { cmd: 'bold', Icon: Bold, active: state.bold },
    { cmd: 'italic', Icon: Italic, active: state.italic },
    { cmd: 'underline', Icon: Underline, active: state.underline },
  ]

  return createPortal(
    <AnimatePresence>
      {state.visible && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="fixed z-[9999] flex items-center gap-0.5 rounded-lg border border-border/80 bg-card p-1 shadow-xl shadow-black/10 backdrop-blur-xl"
          style={{ top: state.y, left: state.x }}
          onMouseDown={(e) => e.preventDefault()} // prevent blur on editor
        >
          {buttons.map(({ cmd, Icon, active }) => (
            <button
              key={cmd}
              onMouseDown={(e) => {
                e.preventDefault()
                onFormat(cmd)
              }}
              className={cn(
                'flex items-center justify-center h-7 w-7 rounded-md transition-colors',
                active
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/* ═══════════════════════════════════════════════════════════
   RichTextarea component
   ═══════════════════════════════════════════════════════════ */

interface RichTextareaProps {
  value: string
  onChange: (md: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  rows?: number
}

export function RichTextarea({
  value,
  onChange,
  placeholder,
  className,
  style,
  rows = 2,
}: RichTextareaProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastValueRef = useRef(value)
  const [toolbar, setToolbar] = useState<ToolbarState>({
    visible: false,
    x: 0,
    y: 0,
    bold: false,
    italic: false,
    underline: false,
  })

  // Sync external value → editor HTML (only when value changes externally)
  useEffect(() => {
    if (!editorRef.current) return
    const currentMd = htmlToMd(editorRef.current.innerHTML)
    if (value !== currentMd) {
      // Save and restore cursor if possible
      const html = mdToHtml(value)
      editorRef.current.innerHTML = html
      lastValueRef.current = value
    }
  }, [value])

  const emitChange = useCallback(() => {
    if (!editorRef.current) return
    const md = htmlToMd(editorRef.current.innerHTML)
    if (md !== lastValueRef.current) {
      lastValueRef.current = md
      onChange(md)
    }
  }, [onChange])

  const updateToolbar = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !editorRef.current?.contains(sel.anchorNode)) {
      setToolbar((prev) => (prev.visible ? { ...prev, visible: false } : prev))
      return
    }

    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (rect.width === 0) {
      setToolbar((prev) => (prev.visible ? { ...prev, visible: false } : prev))
      return
    }

    // Position above selection, centered
    const toolbarW = 100
    const x = Math.max(8, rect.left + rect.width / 2 - toolbarW / 2)
    const y = rect.top - 40

    setToolbar({
      visible: true,
      x,
      y,
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    })
  }, [])

  // Listen for selection changes
  useEffect(() => {
    const handler = () => {
      // Only handle if our editor is focused
      if (editorRef.current?.contains(document.activeElement) || editorRef.current === document.activeElement) {
        updateToolbar()
      }
    }
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [updateToolbar])

  // Hide toolbar on blur (with small delay so toolbar button clicks register)
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (!editorRef.current?.contains(document.activeElement)) {
        setToolbar((prev) => (prev.visible ? { ...prev, visible: false } : prev))
      }
    }, 150)
  }, [])

  const handleFormat = useCallback(
    (cmd: 'bold' | 'italic' | 'underline') => {
      editorRef.current?.focus()
      document.execCommand(cmd, false)
      emitChange()
      // Update toolbar state after format
      setTimeout(updateToolbar, 10)
    },
    [emitChange, updateToolbar]
  )

  // Prevent paste from adding rich HTML from external sources
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()
      const text = e.clipboardData.getData('text/plain')
      document.execCommand('insertText', false, text)
      emitChange()
    },
    [emitChange]
  )

  const minHeight = `${Math.max(rows * 20, 24)}px`

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={handleBlur}
        onPaste={handlePaste}
        onMouseUp={updateToolbar}
        onKeyUp={updateToolbar}
        data-placeholder={placeholder}
        className={cn(
          'w-full bg-transparent focus:outline-none resize-y',
          '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[inherit] [&:empty]:before:opacity-40 [&:empty]:before:pointer-events-none',
          className
        )}
        style={{
          minHeight,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...style,
        }}
      />
      <FloatingToolbar state={toolbar} onFormat={handleFormat} />
    </div>
  )
}
