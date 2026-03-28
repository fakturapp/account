'use client'

import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { InvoicePreview } from '@/components/settings/invoice-preview'
import {
  Zap,
  ClipboardList,
  Banknote,
  Coins,
  PenLine,
  Lock,
  Check,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

export default function InvoiceOptionsPage() {
  const { settings, loading, updateSettings } = useInvoiceSettings()

  function togglePaymentMethod(method: string) {
    const current = settings.paymentMethods
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method]
    updateSettings({ paymentMethods: updated })
  }

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Billing type card */}
            <div className="rounded-xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
              </div>
            </div>
            {/* Payment methods card */}
            <div className="rounded-xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-[72px] rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="p-4 bg-muted/30">
              <Skeleton className="w-full rounded-lg" style={{ aspectRatio: '210/270' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6 px-4 lg:px-6 py-4 md:py-6">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-2xl font-bold text-foreground">Options</h1>
        <p className="text-muted-foreground mt-1">Type de facturation et moyens de paiement</p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Settings Column */}
        <div className="space-y-6">
          {/* Billing Type */}
          <motion.div variants={fadeUp} custom={1}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardList className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Modele de facturation</h2>
                    <p className="text-xs text-muted-foreground">Choisissez le type de facture par defaut</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateSettings({ billingType: 'quick' })}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      settings.billingType === 'quick'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                    }`}
                  >
                    {settings.billingType === 'quick' && (
                      <div className="absolute top-3 right-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <Zap className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium text-sm text-foreground">Rapide</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Facturation simplifiee avec les informations essentielles
                    </p>
                  </button>
                  <button
                    onClick={() => updateSettings({ billingType: 'detailed' })}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      settings.billingType === 'detailed'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                    }`}
                  >
                    {settings.billingType === 'detailed' && (
                      <div className="absolute top-3 right-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <ClipboardList className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium text-sm text-foreground">Complet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Factures detaillees avec TVA, remises, conditions et mentions
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Methods */}
          <motion.div variants={fadeUp} custom={2}>
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Banknote className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Moyens de paiement</h2>
                    <p className="text-xs text-muted-foreground">Modes de paiement affiches sur vos documents</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {/* Bank Transfer */}
                  <button
                    onClick={() => togglePaymentMethod('bank_transfer')}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      settings.paymentMethods.includes('bank_transfer')
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        settings.paymentMethods.includes('bank_transfer') ? 'bg-primary/10' : 'bg-muted'
                      }`}
                    >
                      <Banknote
                        className={`h-5 w-5 ${
                          settings.paymentMethods.includes('bank_transfer')
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Virement bancaire</p>
                      <p className="text-xs text-muted-foreground">IBAN, BIC et nom de la banque</p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        settings.paymentMethods.includes('bank_transfer')
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {settings.paymentMethods.includes('bank_transfer') && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Cash */}
                  <button
                    onClick={() => togglePaymentMethod('cash')}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      settings.paymentMethods.includes('cash')
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        settings.paymentMethods.includes('cash') ? 'bg-primary/10' : 'bg-muted'
                      }`}
                    >
                      <Coins
                        className={`h-5 w-5 ${
                          settings.paymentMethods.includes('cash') ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Especes</p>
                      <p className="text-xs text-muted-foreground">Paiement en especes</p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        settings.paymentMethods.includes('cash')
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {settings.paymentMethods.includes('cash') && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Custom */}
                  <div>
                    <button
                      onClick={() => togglePaymentMethod('custom')}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                        settings.paymentMethods.includes('custom')
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          settings.paymentMethods.includes('custom') ? 'bg-primary/10' : 'bg-muted'
                        }`}
                      >
                        <PenLine
                          className={`h-5 w-5 ${
                            settings.paymentMethods.includes('custom') ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Autre</p>
                        <p className="text-xs text-muted-foreground">Moyen de paiement personnalise</p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          settings.paymentMethods.includes('custom')
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {settings.paymentMethods.includes('custom') && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                    </button>
                    {settings.paymentMethods.includes('custom') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 ml-14"
                      >
                        <Input
                          placeholder="Ex: Cheque, PayPal, etc."
                          value={settings.customPaymentMethod}
                          onChange={(e) => updateSettings({ customPaymentMethod: e.target.value })}
                          className="text-sm"
                        />
                      </motion.div>
                    )}
                  </div>

                  <Separator />

                  {/* Coming Soon */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
                      Bientot disponible
                    </p>
                    {[
                      { name: 'Stripe', desc: 'Paiement en ligne par carte bancaire' },
                      { name: 'PayPal', desc: 'Paiement via compte PayPal' },
                    ].map((method) => (
                      <div
                        key={method.name}
                        className="flex items-center gap-3 rounded-xl border-2 border-border/50 p-4 opacity-50 cursor-not-allowed"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{method.name}</p>
                          <p className="text-xs text-muted-foreground">{method.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Auto-save indicator */}
          <motion.div variants={fadeUp} custom={3} className="flex justify-end">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-green-500" />
              Enregistrement automatique
            </p>
          </motion.div>
        </div>

        {/* Preview Column */}
        <motion.div variants={fadeUp} custom={2}>
          <InvoicePreview />
        </motion.div>
      </div>
    </motion.div>
  )
}
