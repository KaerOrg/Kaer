// Données MOCK déterministes de l'aperçu praticien du Thermomètre de la peur.
// L'aperçu ne lit JAMAIS de vraies données patient (conformité MDR 2017/745) :
// il montre un parcours d'exemple figé pour que le praticien visualise l'écran.
// Les libellés sont des clés i18n (zéro texte en dur).

export interface PreviewSession {
  /** Ancienneté (jours) — la date affichée est calculée au rendu. */
  daysAgo: number
  before: number
  peak: number
  after: number
}

export interface PreviewStep {
  id: string
  /** Clé i18n du libellé d'exemple. */
  labelKey: string
  /** Niveau de stress estimé au départ (0–100). */
  target: number
  done: boolean
  /** Séances ordonnées de la plus ancienne à la plus récente. */
  sessions: PreviewSession[]
}

// Échelle d'exemple, classée du moins au plus angoissant (target croissant).
// Les pics décroissent d'une séance à l'autre → courbe de désensibilisation lisible.
// Toutes les valeurs sont des multiples de 10 (pas du curseur SUDS).
export const PREVIEW_STEPS: readonly PreviewStep[] = [
  {
    id: 'prev-meeting',
    labelKey: 'preview_step_meeting',
    target: 30,
    done: true,
    sessions: [{ daysAgo: 8, before: 40, peak: 50, after: 20 }],
  },
  {
    id: 'prev-drive',
    labelKey: 'preview_step_drive',
    target: 50,
    done: false,
    sessions: [
      { daysAgo: 14, before: 50, peak: 60, after: 40 },
      { daysAgo: 5, before: 40, peak: 50, after: 30 },
    ],
  },
  {
    id: 'prev-mall',
    labelKey: 'preview_step_mall',
    target: 80,
    done: false,
    sessions: [
      { daysAgo: 21, before: 70, peak: 80, after: 50 },
      { daysAgo: 12, before: 60, peak: 70, after: 40 },
      { daysAgo: 3, before: 50, peak: 60, after: 30 },
    ],
  },
]

/** Pics d'une marche, dans l'ordre chronologique (pour la courbe). */
export function peakSeries(step: PreviewStep): number[] {
  return step.sessions.map(s => s.peak)
}

/** 'YYYY-MM-DD' il y a `daysAgo` jours (heure locale). */
export function dateDaysAgo(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
