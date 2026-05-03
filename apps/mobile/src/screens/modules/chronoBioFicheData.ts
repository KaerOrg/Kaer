import { Clock, Brain, Sun, Utensils, Users, Moon, AlertTriangle } from 'lucide-react-native'
import type React from 'react'

type LucideIcon = React.ComponentType<{ size?: number; color?: string }>

export interface TopicVisual {
  readonly color: string
  readonly Icon: LucideIcon
  readonly keyInsight: string
}

export const TOPIC_VISUAL: Readonly<Record<string, TopicVisual>> = {
  what_is_chrono: {
    color: '#6D28D9',
    Icon: Clock,
    keyInsight: 'Un grain de riz dans l\'hypothalamus programme toute votre journée biologique.',
  },
  why_regularity: {
    color: '#0891B2',
    Icon: Brain,
    keyInsight: 'Trois ancrages réguliers suffisent pour stabiliser les rythmes — pas besoin de tout contrôler.',
  },
  light_anchor: {
    color: '#D97706',
    Icon: Sun,
    keyInsight: '10 minutes dehors le matin, même sous un ciel gris — 10 000 lux contre 300 à l\'intérieur.',
  },
  meals_timing: {
    color: '#16A34A',
    Icon: Utensils,
    keyInsight: 'L\'heure du repas est une horloge pour le foie, l\'intestin et le pancréas.',
  },
  social_rhythm: {
    color: '#7C3AED',
    Icon: Users,
    keyInsight: 'Un deuil ou une rupture peut décaler l\'horloge biologique autant qu\'un décalage horaire.',
  },
  sleep_wake: {
    color: '#1D4ED8',
    Icon: Moon,
    keyInsight: 'L\'heure de lever est le bouton reset de toute la cascade hormonale du jour.',
  },
  disruptions: {
    color: '#EA580C',
    Icon: AlertTriangle,
    keyInsight: 'La perturbation est inévitable. Récupérer l\'heure de lever dès le lendemain est le geste le plus efficace.',
  },
}
