'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { useTranslation } from '@/lib/i18n'
import { ChartRevenue } from '@/components/dashboard/chart-revenue'
import { AddChartSidebar, type ChartKey } from '@/components/dashboard/add-chart-sidebar'
import { ChartMonthly } from '@/components/dashboard/chart-monthly'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  Plus,
  X,
  DollarSign,
  AlertCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  GripVertical,
  RotateCcw,
  ArrowUpRight,
  FileText,
  Receipt,
  Clock,
  Sparkles,
} from 'lucide-react'
import { AiDashboardSummary } from '@/components/ai/ai-dashboard-summary'

interface DashboardStats {
  totalInvoiced: { value: number; trend: number; previousValue: number }
  outstanding: { value: number; trend: number }
  totalCollected: { value: number; trend: number; previousValue: number }
}

interface RecentItem {
  id: string
  type: 'invoice' | 'quote'
  number: string
  clientName: string
  amount: number
  status: string
  date: string
}

interface RevenueDataPoint {
  date: string
  factures: number
  devis: number
}

interface MonthlyDataPoint {
  month: string
  label: string
  subtotal: number
  total: number
  count: number
}

interface MicroDataPoint {
  month: string
  label: string
  subtotal: number
  cumulative: number
  count: number
  thresholdServices: number
  thresholdGoods: number
}

const CHARTS_KEY = 'zenvoice_active_charts'
const LAYOUT_KEY = 'zenvoice_dashboard_layout_v1'

type BlockId =
  | 'welcome'
  | 'ai-summary'
  | 'stat-invoiced'
  | 'stat-outstanding'
  | 'stat-collected'
  | 'latest-invoice'
  | 'chart-revenue'
  | 'recent-activity'
  | `chart-${ChartKey}`

const DEFAULT_LAYOUT: BlockId[] = [
  'welcome',
  'stat-invoiced',
  'stat-outstanding',
  'stat-collected',
  'latest-invoice',
  'ai-summary',
  'chart-revenue',
  'recent-activity',
]

// Each block declares its footprint in the 4-column grid. `span` is the
// number of columns it occupies (1..4), `rowSpan` its row height.
const BLOCK_SPAN: Record<string, { span: 1 | 2 | 3 | 4; rowSpan: 1 | 2 }> = {
  welcome: { span: 4, rowSpan: 1 },
  'ai-summary': { span: 4, rowSpan: 1 },
  'stat-invoiced': { span: 1, rowSpan: 1 },
  'stat-outstanding': { span: 1, rowSpan: 1 },
  'stat-collected': { span: 1, rowSpan: 1 },
  'latest-invoice': { span: 1, rowSpan: 1 },
  'chart-revenue': { span: 2, rowSpan: 2 },
  'recent-activity': { span: 2, rowSpan: 2 },
}

function spanClass(id: BlockId) {
  const cfg = BLOCK_SPAN[id] ?? { span: 2, rowSpan: 2 }
  const col = cfg.span === 4
    ? 'md:col-span-2 lg:col-span-4'
    : cfg.span === 3
    ? 'md:col-span-2 lg:col-span-3'
    : cfg.span === 2
    ? 'md:col-span-2 lg:col-span-2'
    : 'md:col-span-1 lg:col-span-1'
  const row = cfg.rowSpan === 2 ? 'lg:row-span-2' : ''
  return `${col} ${row}`
}

function loadLayout(): BlockId[] {
  if (typeof window === 'undefined') return DEFAULT_LAYOUT
  try {
    const saved = localStorage.getItem(LAYOUT_KEY)
    if (!saved) return DEFAULT_LAYOUT
    const parsed = JSON.parse(saved) as BlockId[]
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_LAYOUT
    return parsed
  } catch {
    return DEFAULT_LAYOUT
  }
}

function saveLayout(layout: BlockId[]) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
  } catch {}
}

function loadActiveCharts(): ChartKey[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(CHARTS_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveActiveCharts(charts: ChartKey[]) {
  try {
    localStorage.setItem(CHARTS_KEY, JSON.stringify(charts))
  } catch {}
}

function formatCurrency(amount: number, locale: string) {
  return amount.toLocaleString(locale === 'en' ? 'en-US' : 'fr-FR', {
    style: 'currency',
    currency: 'EUR',
  })
}

function formatDate(dateStr: string, locale: string) {
  try {
    return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
      day: '2-digit',
      month: 'short',
    })
  } catch {
    return dateStr
  }
}

/* ─────────────── Bento block shell with drag handlers ─────────────── */

interface BentoBlockProps {
  id: BlockId
  onDragStart: (id: BlockId) => void
  onDragOver: (id: BlockId) => void
  onDrop: () => void
  onDragEnd: () => void
  isDragging: boolean
  isDragOver: boolean
  children: React.ReactNode
  className?: string
}

function BentoBlock({
  id,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
  children,
  className,
}: BentoBlockProps) {
  // Outer motion.div handles the FLIP layout animation when the grid
  // reorders; the inner div is the real drag target so HTML5 drag events
  // don't collide with framer-motion's own pan gesture props.
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      className={cn('relative', spanClass(id), className)}
    >
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', id)
          onDragStart(id)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          onDragOver(id)
        }}
        onDrop={(e) => {
          e.preventDefault()
          onDrop()
        }}
        onDragEnd={() => onDragEnd()}
        className={cn(
          'group/block relative w-full h-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-40 scale-[0.98]',
          isDragOver && 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background'
        )}
      >
        {/* Drag handle — visible on hover */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/block:opacity-100 transition-opacity pointer-events-none">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  )
}

/* ─────────────── Individual block renderers ─────────────── */

function StatBlock({
  label,
  value,
  trend,
  description,
  previousValue,
  isSnapshot,
  theme,
}: {
  label: string
  value: string
  trend: number
  description: string
  previousValue?: string
  isSnapshot?: boolean
  theme: 'indigo' | 'amber' | 'emerald'
}) {
  const themes = {
    indigo: {
      grad: 'from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-500/15',
      accent: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20',
      trendBg: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20',
      icon: DollarSign,
    },
    amber: {
      grad: 'from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15',
      accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
      trendBg: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
      icon: AlertCircle,
    },
    emerald: {
      grad: 'from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15',
      accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
      trendBg: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
      icon: Wallet,
    },
  }
  const t = themes[theme]
  const Icon = t.icon
  return (
    <div className={cn('relative h-full bg-gradient-to-br p-5 flex flex-col', t.grad)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {!isSnapshot && (
          <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border', t.trendBg)}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold tabular-nums text-foreground leading-tight">{value}</div>
      <div className="mt-auto pt-2 text-[11px] text-muted-foreground">
        {description}
        {previousValue && <div className="mt-0.5 text-[10px] opacity-70">{previousValue}</div>}
      </div>
      <div className={cn('absolute -right-4 -bottom-4 h-20 w-20 rounded-2xl ring-1 flex items-center justify-center opacity-20 rotate-12', t.accent)}>
        <Icon className="h-10 w-10" />
      </div>
    </div>
  )
}

function LatestInvoiceBlock({
  item,
  locale,
  t,
}: {
  item: RecentItem | null
  locale: string
  t: (key: string) => string
}) {
  if (!item) {
    return (
      <div className="relative h-full p-5 flex flex-col">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          {t('dashboard.latestInvoice')}
        </span>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
            <FileText className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <p className="text-xs text-muted-foreground">{t('dashboard.noInvoiceYet')}</p>
          <Link
            href="/dashboard/invoices/new"
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> {t('dashboard.createFirst')}
          </Link>
        </div>
      </div>
    )
  }
  const Icon = item.type === 'invoice' ? FileText : Receipt
  return (
    <Link
      href={`/dashboard/${item.type === 'invoice' ? 'invoices' : 'quotes'}/${item.id}`}
      className="relative h-full p-5 flex flex-col group/latest hover:bg-muted/20 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t('dashboard.latestInvoice')}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/latest:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{item.number}</p>
          <p className="text-xs text-muted-foreground truncate">{item.clientName}</p>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(item.amount, locale)}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(item.date, locale)}
          </div>
        </div>
        <Badge variant={statusVariant(item.status)} className="text-[10px]">
          {t(`dashboard.statuses.${item.status}`) || item.status}
        </Badge>
      </div>
    </Link>
  )
}

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' | 'muted' {
  switch (status) {
    case 'paid':
    case 'accepted':
      return 'success'
    case 'overdue':
    case 'rejected':
      return 'destructive'
    case 'pending':
      return 'warning'
    case 'draft':
      return 'muted'
    default:
      return 'default'
  }
}

function RecentActivityBlock({
  items,
  locale,
  t,
}: {
  items: RecentItem[]
  locale: string
  t: (key: string) => string
}) {
  return (
    <div className="h-full flex flex-col p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{t('dashboard.recentActivity.title')}</h3>
        <Link href="/dashboard/invoices" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          {t('dashboard.viewAll') || 'Tout voir'}
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
            <Clock className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <p className="text-xs text-muted-foreground">{t('dashboard.recentActivity.empty')}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1">
          {items.slice(0, 6).map((item) => {
            const Icon = item.type === 'invoice' ? FileText : Receipt
            return (
              <Link
                key={item.id}
                href={`/dashboard/${item.type === 'invoice' ? 'invoices' : 'quotes'}/${item.id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{item.number}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{item.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold tabular-nums text-foreground">{formatCurrency(item.amount, locale)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(item.date, locale)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─────────────── Main page ─────────────── */

export default function DashboardPage() {
  const { user } = useAuth()
  const { t, locale } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [chartData, setChartData] = useState<RevenueDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [addChartOpen, setAddChartOpen] = useState(false)
  const [activeCharts, setActiveCharts] = useState<ChartKey[]>(loadActiveCharts)
  const [layout, setLayout] = useState<BlockId[]>(loadLayout)

  // Drag-and-drop state
  const [draggingId, setDraggingId] = useState<BlockId | null>(null)
  const [dragOverId, setDragOverId] = useState<BlockId | null>(null)
  const pendingLayoutRef = useRef<BlockId[] | null>(null)

  // Chart data states
  const [revenueData, setRevenueData] = useState<MonthlyDataPoint[]>([])
  const [collectedData, setCollectedData] = useState<MonthlyDataPoint[]>([])
  const [microData, setMicroData] = useState<MicroDataPoint[]>([])

  useEffect(() => {
    loadDashboard()
  }, [])

  // Ensure dynamic chart blocks appear in the layout when toggled on
  useEffect(() => {
    setLayout((prev) => {
      const wanted = activeCharts.map((k) => `chart-${k}` as BlockId)
      const next = [...prev]
      let changed = false
      for (const id of wanted) {
        if (!next.includes(id)) {
          next.push(id)
          changed = true
        }
      }
      // Remove chart blocks that were toggled off
      const filtered = next.filter((id) => {
        if (!id.startsWith('chart-') || id === 'chart-revenue') return true
        const k = id.replace('chart-', '') as ChartKey
        return activeCharts.includes(k)
      })
      if (filtered.length !== next.length) changed = true
      if (changed) saveLayout(filtered)
      return changed ? filtered : prev
    })
  }, [activeCharts])

  // Fetch chart-specific data when activeCharts changes
  useEffect(() => {
    for (const key of activeCharts) {
      if (key === 'revenue' && revenueData.length === 0) {
        api.get<{ data: MonthlyDataPoint[] }>('/dashboard/charts/revenue').then(({ data }) => {
          if (data?.data) setRevenueData(data.data)
        })
      }
      if (key === 'collected' && collectedData.length === 0) {
        api.get<{ data: MonthlyDataPoint[] }>('/dashboard/charts/collected').then(({ data }) => {
          if (data?.data) setCollectedData(data.data)
        })
      }
      if (key === 'micro' && microData.length === 0) {
        api.get<{ data: MicroDataPoint[] }>('/dashboard/charts/micro-thresholds').then(({ data }) => {
          if (data?.data) setMicroData(data.data)
        })
      }
    }
  }, [activeCharts])

  async function loadDashboard() {
    const { data } = await api.get<{
      stats: DashboardStats
      recent: RecentItem[]
      chartData?: RevenueDataPoint[]
    }>('/dashboard')
    if (data) {
      setStats(data.stats)
      setRecent(data.recent || [])
      setChartData(data.chartData || [])
    }
    setLoading(false)
  }

  const handleAddChart = useCallback((key: ChartKey) => {
    setActiveCharts((prev) => {
      if (prev.includes(key)) return prev
      const next = [...prev, key]
      saveActiveCharts(next)
      return next
    })
  }, [])

  const handleRemoveChart = useCallback((key: ChartKey) => {
    setActiveCharts((prev) => {
      const next = prev.filter((k) => k !== key)
      saveActiveCharts(next)
      return next
    })
  }, [])

  /* ─── Drag-and-drop callbacks ─── */

  const handleDragStart = useCallback((id: BlockId) => {
    setDraggingId(id)
  }, [])

  const handleDragOver = useCallback(
    (targetId: BlockId) => {
      if (!draggingId || draggingId === targetId) return
      setDragOverId(targetId)
      // Live preview: reorder the layout on hover
      setLayout((prev) => {
        const next = [...prev]
        const from = next.indexOf(draggingId)
        const to = next.indexOf(targetId)
        if (from === -1 || to === -1) return prev
        next.splice(from, 1)
        next.splice(to, 0, draggingId)
        pendingLayoutRef.current = next
        return next
      })
    },
    [draggingId]
  )

  const handleDrop = useCallback(() => {
    if (pendingLayoutRef.current) {
      saveLayout(pendingLayoutRef.current)
      pendingLayoutRef.current = null
    }
    setDragOverId(null)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (pendingLayoutRef.current) {
      saveLayout(pendingLayoutRef.current)
      pendingLayoutRef.current = null
    }
    setDraggingId(null)
    setDragOverId(null)
  }, [])

  const handleResetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT)
    saveLayout(DEFAULT_LAYOUT)
  }, [])

  /* ─── Latest invoice ─── */

  const latestInvoice = useMemo(() => {
    return recent.find((r) => r.type === 'invoice') || null
  }, [recent])

  /* ─── Loading skeleton ─── */

  if (loading) {
    return (
      <div className="px-4 lg:px-6 py-4 md:py-6 space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                'rounded-2xl',
                i < 4 ? 'h-32 col-span-1 md:col-span-1' : 'h-64 col-span-2 md:col-span-2'
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  /* ─── Block renderer ─── */

  const renderBlockContent = (id: BlockId): React.ReactNode => {
    switch (id) {
      case 'welcome':
        return (
          <div className="relative h-full p-6 flex items-center justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {t('dashboard.welcome.hello') || 'Bonjour'}
                {user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} !
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('dashboard.welcome.subtitle') || "Voici un aperçu de votre activité."}
              </p>
            </div>
            <div className="hidden md:flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
        )
      case 'ai-summary':
        return (
          <div className="p-1">
            <AiDashboardSummary />
          </div>
        )
      case 'stat-invoiced':
        return (
          <StatBlock
            label={t('dashboard.stats.totalInvoiced') || 'Total facturé'}
            value={stats ? formatCurrency(stats.totalInvoiced.value, locale) : '—'}
            trend={stats?.totalInvoiced.trend ?? 0}
            description={t('dashboard.stats.thisMonth') || 'Ce mois-ci'}
            previousValue={stats ? `${t('dashboard.stats.lastMonth') || 'Mois dernier'} : ${formatCurrency(stats.totalInvoiced.previousValue, locale)}` : undefined}
            theme="indigo"
          />
        )
      case 'stat-outstanding':
        return (
          <StatBlock
            label={t('dashboard.stats.outstanding') || 'Vos clients vous doivent'}
            value={stats ? formatCurrency(stats.outstanding.value, locale) : '—'}
            trend={0}
            description={t('dashboard.stats.pendingInvoices') || 'Factures en attente'}
            isSnapshot
            theme="amber"
          />
        )
      case 'stat-collected':
        return (
          <StatBlock
            label={t('dashboard.stats.totalCollected') || 'Total encaissé'}
            value={stats ? formatCurrency(stats.totalCollected.value, locale) : '—'}
            trend={stats?.totalCollected.trend ?? 0}
            description={t('dashboard.stats.thisMonth') || 'Ce mois-ci'}
            previousValue={stats ? `${t('dashboard.stats.lastMonth') || 'Mois dernier'} : ${formatCurrency(stats.totalCollected.previousValue, locale)}` : undefined}
            theme="emerald"
          />
        )
      case 'latest-invoice':
        return <LatestInvoiceBlock item={latestInvoice} locale={locale} t={t} />
      case 'chart-revenue':
        return (
          <div className="p-1 h-full">
            <ChartRevenue data={chartData} />
          </div>
        )
      case 'recent-activity':
        return <RecentActivityBlock items={recent} locale={locale} t={t} />
      default: {
        // Dynamic chart blocks
        if (id.startsWith('chart-')) {
          const key = id.replace('chart-', '') as ChartKey
          return (
            <div className="relative p-1 h-full">
              <button
                onClick={() => handleRemoveChart(key)}
                className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-card/80 backdrop-blur-sm shadow border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover/block:opacity-100"
                title={t('dashboard.remove') || 'Retirer'}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {key === 'revenue' && (
                <ChartMonthly
                  title={t('dashboard.charts.revenue') || "Chiffre d'affaires HT"}
                  description={t('dashboard.charts.revenueDesc') || 'CA hors taxes facturé par mois (12 mois)'}
                  data={revenueData}
                  dataKey="subtotal"
                  color="var(--color-chart-1)"
                />
              )}
              {key === 'collected' && (
                <ChartMonthly
                  title={t('dashboard.charts.collected') || "Chiffre d'affaires encaissé"}
                  description={t('dashboard.charts.collectedDesc') || 'Paiements reçus par mois (12 mois)'}
                  data={collectedData}
                  dataKey="subtotal"
                  color="var(--color-chart-2)"
                />
              )}
              {key === 'micro' && (
                <ChartMonthly
                  title={t('dashboard.charts.micro') || 'Seuils de ma micro'}
                  description={`${t('dashboard.charts.microDesc') || 'CA cumulé vs seuils micro-entrepreneur'} (${new Date().getFullYear()})`}
                  data={microData}
                  dataKey="cumulative"
                  color="var(--color-chart-5)"
                  thresholds={[
                    { value: 77700, label: t('dashboard.charts.servicesThreshold') || 'Seuil services', color: '#f59e0b' },
                    { value: 188700, label: t('dashboard.charts.goodsThreshold') || 'Seuil marchandises', color: '#ef4444' },
                  ]}
                />
              )}
            </div>
          )
        }
        return null
      }
    }
  }

  return (
    <div className="px-4 lg:px-6 py-4 md:py-6 space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleResetLayout}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted/50 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          title={t('dashboard.resetLayout') || 'Réinitialiser la disposition'}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{t('dashboard.resetLayout') || 'Réinitialiser'}</span>
        </button>
        <button
          onClick={() => setAddChartOpen(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted/50 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{t('dashboard.addChart') || 'Ajouter un graphique'}</span>
        </button>
      </div>

      {/* Bento grid */}
      <div
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(160px,auto)] gap-4"
      >
        <AnimatePresence mode="popLayout">
          {layout.map((id) => (
            <BentoBlock
              key={id}
              id={id}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={draggingId === id}
              isDragOver={dragOverId === id}
            >
              {renderBlockContent(id)}
            </BentoBlock>
          ))}
        </AnimatePresence>
      </div>

      <AddChartSidebar
        open={addChartOpen}
        onClose={() => setAddChartOpen(false)}
        onAddChart={handleAddChart}
        activeCharts={activeCharts}
      />
    </div>
  )
}
