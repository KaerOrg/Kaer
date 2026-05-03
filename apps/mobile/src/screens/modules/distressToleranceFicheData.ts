import { BookOpen, Zap, Wind, Heart, Star, Scale } from 'lucide-react-native'
import type React from 'react'

type LucideIcon = React.ComponentType<{ size?: number; color?: string }>

export interface TopicVisual {
  readonly color: string
  readonly Icon: LucideIcon
  readonly keyInsight: string
}

export const TOPIC_VISUAL: Readonly<Record<string, TopicVisual>> = {
  intro: {
    color: '#475569',
    Icon: BookOpen,
    keyInsight: 'Traverser la vague sans l\'aggraver — aucune décision irréversible dans la tempête.',
  },
  tipp: {
    color: '#DC2626',
    Icon: Zap,
    keyInsight: 'Le froid sur le visage ralentit le cœur en secondes. Le corps peut se calmer avant le mental.',
  },
  accepts: {
    color: '#0284C7',
    Icon: Wind,
    keyInsight: 'Se distraire intentionnellement, c\'est donner au cerveau émotionnel le temps de se désamorcer.',
  },
  self_soothing: {
    color: '#DB2777',
    Icon: Heart,
    keyInsight: 'Deux sens activés simultanément = signal direct au système nerveux. Pas besoin de comprendre pour que ça marche.',
  },
  improve: {
    color: '#D97706',
    Icon: Star,
    keyInsight: 'En crise, chercher le sens — même minime — change le rapport à la douleur.',
  },
  pros_cons: {
    color: '#059669',
    Icon: Scale,
    keyInsight: 'Mettre en pause l\'impulsion 5 minutes. Le regret d\'avoir attendu est toujours plus doux.',
  },
}
