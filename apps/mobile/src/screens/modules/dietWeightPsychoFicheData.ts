import { Moon, Apple, Footprints, Info, Pill, Zap, SmilePlus, HeartPulse } from 'lucide-react-native'
import type React from 'react'

type LucideIcon = React.ComponentType<{ size?: number; color?: string }>

export interface TopicVisual {
  readonly color: string
  readonly Icon: LucideIcon
  readonly keyInsight: string
}

export const TOPIC_VISUAL: Readonly<Record<string, TopicVisual>> = {
  sleep_chrono: {
    color: '#1D4ED8',
    Icon: Moon,
    keyInsight: 'Le lever à heure fixe est le synchroniseur le plus puissant de l\'horloge biologique — plus que le coucher.',
  },
  nutrition_brain: {
    color: '#16A34A',
    Icon: Apple,
    keyInsight: '95 % de la sérotonine est produite dans l\'intestin. Ce que vous mangez parle à votre cerveau.',
  },
  gentle_activity: {
    color: '#0891B2',
    Icon: Footprints,
    keyInsight: '5 minutes de marche valent mieux que zéro. Le BDNF commence à se libérer dès les premières minutes.',
  },
  general: {
    color: '#475569',
    Icon: Info,
    keyInsight: 'Ces effets varient selon la molécule, la dose et la durée de traitement. Rien n\'est une fatalité.',
  },
  antipsychotics: {
    color: '#7C3AED',
    Icon: Pill,
    keyInsight: 'Le signal de satiété prend 15 à 20 minutes. Manger lentement donne au cerveau le temps d\'entendre.',
  },
  methylphenidate: {
    color: '#D97706',
    Icon: Zap,
    keyInsight: 'Le petit-déjeuner avant la prise — pas après. C\'est la règle numéro un pour préserver les apports.',
  },
  antidepressants: {
    color: '#DB2777',
    Icon: SmilePlus,
    keyInsight: 'Les nausées initiales sont temporaires. Prendre l\'antidépresseur avec de la nourriture les réduit.',
  },
  mood_stabilizers: {
    color: '#059669',
    Icon: HeartPulse,
    keyInsight: 'Pour le lithium : sel et hydratation réguliers. Aucune restriction alimentaire sans avis médical.',
  },
}
