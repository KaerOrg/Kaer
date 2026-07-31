import { colors } from '@theme'
import { contrastBetween, AA_TEXT, AA_NON_TEXT } from '@kaer/shared'
import { styles } from './Button.styles'

// #274 — Le contraste de CHAQUE variante de bouton, figé par le calcul.
//
// Les teintes claires de la charte échouaient le seuil AA dès qu'elles portaient du
// texte : blanc sur `primary` (#6dbfc3) plafonnait à 2,12:1, `primary` sur
// `primaryLight` à 1,95:1, pour un minimum requis de 4,5:1. Un bouton illisible
// n'est pas un détail d'esthétique dans une app de soin utilisée en situation de
// détresse.
//
// Ce test n'est pas décoratif : il rend la régression impossible. Reteinter un
// bouton en clair le fera échouer, y compris dans deux ans.

/** Fond réellement derrière un bouton transparent : le fond d'écran de l'app. */
const APP_BACKGROUND = colors.background

function ratio(foreground: string, background: string): number {
  const value = contrastBetween(foreground, background)
  if (value == null) throw new Error(`couleur illisible : ${foreground} / ${background}`)
  return value
}

describe('Button — contraste des libellés (seuil AA 4,5:1)', () => {
  it('primary : libellé sur son fond plein', () => {
    expect(ratio(styles.primaryLabel.color, styles.primary.backgroundColor))
      .toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('secondary : libellé sur son fond clair', () => {
    expect(ratio(styles.secondaryLabel.color, styles.secondary.backgroundColor))
      .toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('ghost : libellé sur le fond de l\'app (le bouton est transparent)', () => {
    expect(ratio(styles.ghostLabel.color, APP_BACKGROUND)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('danger : libellé sur son fond rosé', () => {
    expect(ratio(styles.dangerLabel.color, styles.danger.backgroundColor))
      .toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('ghostDanger : libellé sur le fond de l\'app', () => {
    expect(ratio(styles.ghostDangerLabel.color, APP_BACKGROUND)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('les libellés tiennent aussi sur une carte blanche', () => {
    // Un bouton transparent est souvent posé dans une Card : l'autre fond possible.
    expect(ratio(styles.ghostLabel.color, colors.card)).toBeGreaterThanOrEqual(AA_TEXT)
    expect(ratio(styles.ghostDangerLabel.color, colors.card)).toBeGreaterThanOrEqual(AA_TEXT)
  })
})

describe('Button — contraste des bordures (seuil non textuel 3:1)', () => {
  it('secondary : le filet se distingue de son propre fond', () => {
    expect(ratio(styles.secondary.borderColor, styles.secondary.backgroundColor))
      .toBeGreaterThanOrEqual(AA_NON_TEXT)
  })

  it('danger : le filet se distingue de son propre fond', () => {
    expect(ratio(styles.danger.borderColor, styles.danger.backgroundColor))
      .toBeGreaterThanOrEqual(AA_NON_TEXT)
  })
})

describe('Button — les teintes claires restent bannies du texte', () => {
  it('aucune variante ne remet `primary` ou `danger` en couleur de libellé', () => {
    // Le garde-fou du garde-fou : si quelqu'un « restaure la charte » sur un
    // libellé, le seuil tombe et ce test le dit avant la revue.
    const labelColors = [
      styles.primaryLabel.color,
      styles.secondaryLabel.color,
      styles.ghostLabel.color,
      styles.dangerLabel.color,
      styles.ghostDangerLabel.color,
    ]
    expect(labelColors).not.toContain(colors.primary)
    expect(labelColors).not.toContain(colors.danger)
  })
})
