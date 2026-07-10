// Presets de graphiques propres aux modules cliniques (échelles, humeur, peur).
// Domaine métier : bornes d'axe par échelle, dimensions d'humeur, couleurs SUDS.
// Les couleurs sont tirées de la palette générique (`lib/chartConfig`).

import { CHART_PALETTE, DEFAULT_CHART_COLOR } from '../../../lib/chartConfig'

// Couleur de tracé + borne haute de l'axe Y par échelle clinique (yMax = domaine).
export const SCALE_CONFIG: Record<string, { color: string; yMax: number }> = {
  phq9:    { color: CHART_PALETTE[0],  yMax: 27 },
  gad7:    { color: CHART_PALETTE[2],  yMax: 21 },
  bsl23:   { color: CHART_PALETTE[3],  yMax: 4  },
  epds:    { color: CHART_PALETTE[5],  yMax: 30 },
  rcads:   { color: CHART_PALETTE[4],  yMax: 50 },
  asrs6:   { color: CHART_PALETTE[6],  yMax: 24 },
  snap_iv: { color: CHART_PALETTE[7],  yMax: 78 },
  nsi:     { color: CHART_PALETTE[12], yMax: 45 },
}

export const DEFAULT_SCALE_COLOR = DEFAULT_CHART_COLOR

// Dimensions du mood tracker (clés métier + couleur de série).
export const MOOD_DIMENSIONS = [
  { key: 'humeur',       color: CHART_PALETTE[1]  },
  { key: 'energie',      color: CHART_PALETTE[6]  },
  { key: 'anxiete',      color: CHART_PALETTE[3]  },
  { key: 'plaisir',      color: CHART_PALETTE[2]  },
  { key: 'sommeil',      color: CHART_PALETTE[4]  },
  { key: 'alimentation', color: CHART_PALETTE[5]  },
] as const

// Thermomètre de la peur — SUDS avant / après exposition.
export const FEAR_BEFORE_COLOR = CHART_PALETTE[2]
export const FEAR_AFTER_COLOR = CHART_PALETTE[1]

// Activation comportementale — P/A ressentis (mêmes teintes que l'app patient).
export const BA_PLEASURE_COLOR = CHART_PALETTE[1]
export const BA_MASTERY_COLOR = CHART_PALETTE[0]
