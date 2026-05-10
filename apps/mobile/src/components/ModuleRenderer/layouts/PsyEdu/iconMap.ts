import type React from 'react'
import {
  AlertTriangle,
  Apple,
  BookOpen,
  Brain,
  BrainCircuit,
  Clock,
  Footprints,
  Heart,
  HeartPulse,
  Info,
  ListChecks,
  Moon,
  Pill,
  Scale,
  Search,
  SmilePlus,
  Star,
  Sun,
  Users,
  Utensils,
  Waves,
  Wind,
  Zap,
} from 'lucide-react-native'

type LucideIcon = React.ComponentType<{ size?: number; color?: string }>

export const PSYEDU_ICONS: Readonly<Record<string, LucideIcon>> = {
  AlertTriangle,
  Apple,
  BookOpen,
  Brain,
  BrainCircuit,
  Clock,
  Footprints,
  Heart,
  HeartPulse,
  Info,
  ListChecks,
  Moon,
  Pill,
  Scale,
  Search,
  SmilePlus,
  Star,
  Sun,
  Users,
  Utensils,
  Waves,
  Wind,
  Zap,
}

export function resolvePsyEduIcon(name: string): LucideIcon {
  return PSYEDU_ICONS[name] ?? BookOpen
}
