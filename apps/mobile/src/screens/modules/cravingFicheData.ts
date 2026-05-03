import { Zap, Search, Waves, Heart } from 'lucide-react-native'
import type React from 'react'

type LucideIcon = React.ComponentType<{ size?: number; color?: string }>

export interface TopicVisual {
  readonly color: string
  readonly colorLight: string
  readonly Icon: LucideIcon
  readonly keyInsight: string
}

// Propriétés visuelles statiques par topic_key — le contenu des blocs vient de Supabase.
export const TOPIC_VISUAL: Readonly<Record<string, TopicVisual>> = {
  what_is_craving: {
    color: '#7C3AED',
    colorLight: '#EDE9FE',
    Icon: Zap,
    keyInsight: 'Un craving dure 15 à 20 minutes. Il monte, il plafonne, il passe.',
  },
  triggers_abc: {
    color: '#0891B2',
    colorLight: '#CFFAFE',
    Icon: Search,
    keyInsight: 'Un déclencheur identifié est un craving à moitié résolu.',
  },
  urge_surfing: {
    color: '#1D4ED8',
    colorLight: '#DBEAFE',
    Icon: Waves,
    keyInsight: 'Vous n\'avez pas à combattre la vague — observez-la passer.',
  },
  after_the_craving: {
    color: '#DB2777',
    colorLight: '#FCE7F3',
    Icon: Heart,
    keyInsight: 'Un craquage est une information, pas un verdict.',
  },
}
