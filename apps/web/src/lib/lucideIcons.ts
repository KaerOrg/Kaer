import type React from 'react'
import {
  Shield, Handshake, Zap, Pill, ClipboardList, BookOpen,
  Moon, Apple, Clock, Smile, Target, Activity, Brain, Search,
  Leaf, Waves, Thermometer, TrendingUp, Wind, RefreshCw, BookMarked, Scale,
} from 'lucide-react'

export const LUCIDE_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  shield:           Shield,
  handshake:        Handshake,
  zap:              Zap,
  pill:             Pill,
  'clipboard-list': ClipboardList,
  'book-open':      BookOpen,
  moon:             Moon,
  apple:            Apple,
  clock:            Clock,
  smile:            Smile,
  target:           Target,
  activity:         Activity,
  brain:            Brain,
  search:           Search,
  leaf:             Leaf,
  waves:            Waves,
  thermometer:      Thermometer,
  'trending-up':    TrendingUp,
  wind:             Wind,
  'refresh-cw':     RefreshCw,
  bookmark:         BookMarked,
  scale:            Scale,
}
