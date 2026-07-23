export const colors = {
  primary: '#6dbfc3',
  primaryLight: '#EFF6FF',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  // Rouge foncé réservé au TEXTE de crise (titre du bandeau) : contraste AA sur blanc
  // (≈ 4.9:1), là où `danger` (#EF4444) reste l'accent/icône. Jamais une couleur de
  // gravité clinique conditionnée par la donnée (MDR 2017/745) — élément fixe.
  dangerText: '#DC2626',
  dangerLight: '#FEE2E2',
  neutral: '#F3F4F6',
  white: '#FFFFFF',
  stars: '#F59E0B',
  // Barres purement DESCRIPTIVES (écarts en minutes, plages horaires) : gris neutre
  // imposé, jamais une teinte de gravité clinique (MDR 2017/745). Partagé web ≡ mobile.
  neutralBar: '#94A3B8',
  // Voile des overlays (modales, feuilles bas d'écran)
  overlay: 'rgba(0,0,0,0.45)',
  // Voile opaque des visionneuses plein écran (diaporama photo) : la photo prime.
  overlayStrong: 'rgba(0,0,0,0.92)',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
} as const

export const fontSize = {
  caption: 14,
  body: 16,
  h3: 18,
  h2: 22,
  h1: 28,
} as const
