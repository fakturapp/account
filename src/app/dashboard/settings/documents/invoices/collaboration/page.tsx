'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Users, FlaskConical, AlertTriangle, Zap, Eye, MousePointer2, Share2 } from 'lucide-react'

export default function CollaborationSettingsPage() {
  const { settings, updateSettings, loading } = useInvoiceSettings()
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const enabled = settings.collaborationEnabled

  const handleToggle = () => {
    if (!enabled) {
      // Show warning before enabling
      setConfirmOpen(true)
    } else {
      // Disable immediately
      updateSettings({ collaborationEnabled: false })
      toast('Collaboration desactivee', 'info')
    }
  }

  const handleConfirmEnable = () => {
    updateSettings({ collaborationEnabled: true })
    toast('Collaboration activee', 'success')
    setConfirmOpen(false)
  }

  if (loading) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Collaboration en temps reel
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-500 uppercase tracking-wider">
                <FlaskConical className="h-2.5 w-2.5" />
                Beta
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Editez vos documents a plusieurs en temps reel
            </p>
          </div>
        </div>
      </div>

      {/* Toggle card */}
      <div className="rounded-xl border border-border bg-card/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              {enabled ? 'Collaboration activee' : 'Collaboration desactivee'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              {enabled
                ? 'Les membres de votre equipe peuvent voir qui edite un document et collaborer en temps reel.'
                : 'Activez pour permettre l\'edition collaborative en temps reel sur vos documents.'}
            </p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enabled ? 'bg-purple-500' : 'bg-muted'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Features description */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { icon: MousePointer2, title: 'Curseurs en temps reel', desc: 'Voyez ou se trouve chaque collaborateur sur le document' },
          { icon: Zap, title: 'Synchronisation instantanee', desc: 'Chaque modification est visible instantanement par tous' },
          { icon: Eye, title: 'Presence en direct', desc: 'Avatars des personnes connectees sur chaque document' },
          { icon: Share2, title: 'Partage par lien', desc: 'Generez des liens de partage avec permissions personnalisees' },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className={`rounded-lg border border-border p-3.5 transition-opacity ${enabled ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <Icon className="h-4 w-4 text-purple-500" />
              <h4 className="text-sm font-medium text-foreground">{title}</h4>
            </div>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      {/* Warning confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} className="max-w-md">
        <DialogTitle className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          Fonctionnalite en beta extreme
        </DialogTitle>
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            La collaboration en temps reel est une fonctionnalite <span className="font-semibold text-amber-500">experimentale en beta extreme</span>.
          </p>
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-600 dark:text-amber-400 space-y-1.5">
            <p className="font-semibold">Risques connus :</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Des bugs d&apos;affichage ou de synchronisation peuvent survenir</li>
              <li>Les curseurs peuvent etre decales dans certaines situations</li>
              <li>Des conflits d&apos;edition sont possibles si deux personnes modifient le meme champ</li>
              <li>La fonctionnalite peut etre instable ou lente selon la connexion</li>
              <li>Des pertes de donnees mineures sont possibles en cas de deconnexion</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            Vous pourrez desactiver cette fonctionnalite a tout moment depuis cette page.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleConfirmEnable} className="bg-purple-500 hover:bg-purple-600 gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            Activer la beta
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
