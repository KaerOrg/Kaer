import { describe, it, expect } from 'vitest'
import { parseColor, contrastRatio, blend, type Rgb } from './accessibleColor'
import { densityAlpha, densityOpacity, DENSITY_STEPS } from './emotionNamingDensity'

// Audit de contraste des surfaces TEINTÉES du module « Nommer ce que je ressens »
// (#271). Les textes posés sur un token (`--color-text` sur `--color-surface`) sont
// couverts par le jeu de tokens ; ce qui mérite un test, ce sont les cellules dont le
// fond est calculé : matrice du répertoire (teinte de famille + alpha) et croisement
// contexte × famille (primaire + opacité). C'est là qu'un palier trop dense rendrait
// le chiffre illisible.

const WHITE: Rgb = { r: 255, g: 255, b: 255 }
/** `--color-text` du thème partagé. */
const TEXT: Rgb = { r: 0x11, g: 0x18, b: 0x27 }
/** `--color-primary` du thème partagé. */
const PRIMARY = '#6dbfc3'

/** Les teintes pastel de famille posées en base (seed emotion_wheel). */
const FAMILY_COLORS = [
  '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6',
  '#6B8E23', '#B0728A', '#F97316', '#14B8A6',
]

const AA = 4.5

describe('contraste des cellules de la matrice du répertoire', () => {
  it('garde le chiffre au-dessus de AA sur toutes les familles et tous les paliers', () => {
    for (const color of FAMILY_COLORS) {
      const rgb = parseColor(color)
      expect(rgb, `couleur de famille illisible : ${color}`).not.toBeNull()
      for (const count of [1, 2, 4, 7, 50]) {
        const alpha = Number.parseInt(densityAlpha(count), 16) / 255
        const background = blend(rgb!, WHITE, alpha)
        const ratio = contrastRatio(TEXT, background)
        expect(ratio, `${color} au palier ${count} (alpha ${alpha.toFixed(2)})`).toBeGreaterThanOrEqual(AA)
      }
    }
  })
})

describe('contraste des cellules du croisement contexte x famille', () => {
  it('garde le comptage au-dessus de AA sur tous les paliers de densité', () => {
    const primary = parseColor(PRIMARY)!
    for (const count of [...DENSITY_STEPS, 50]) {
      const background = blend(primary, WHITE, densityOpacity(count))
      const ratio = contrastRatio(TEXT, background)
      expect(ratio, `palier ${count} (opacité ${densityOpacity(count)})`).toBeGreaterThanOrEqual(AA)
    }
  })

  it('reste au-dessus de AA même si la rampe montait jusqu\'à l\'opacité pleine', () => {
    // Garde-fou : si un jour un palier plus dense est ajouté, ce test doit encore passer.
    const primary = parseColor(PRIMARY)!
    expect(contrastRatio(TEXT, blend(primary, WHITE, 1))).toBeGreaterThanOrEqual(AA)
  })
})
