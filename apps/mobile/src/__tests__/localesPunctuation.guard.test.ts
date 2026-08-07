// ─── Garde-fou : aucun tiret long dans les textes patient ────────────────────
//
// Le tiret cadratin (U+2014) et le demi-cadratin (U+2013) sont bannis de tout texte
// visible : ils signent une écriture automatique et nuisent à la lisibilité. La règle
// impose la ponctuation juste selon le sens (deux-points, virgule, point, « à » pour
// une plage). Voir `.claude/rules/coding-standards.md` § Ponctuation.
//
// Les locales sont l'endroit où la règle compte le plus, puisque tout y est du texte
// rendu à l'écran, et l'endroit où elle se relâche le plus facilement : un fichier de
// 2000+ lignes se relit mal, et un merge y réintroduit du contenu sans revue.

import { localeFiles } from '../test-utils/locales'

// U+2013 (demi-cadratin) et U+2014 (cadratin), écrits en échappement pour que le
// garde-fou ne se déclenche pas sur son propre code source.
const LONG_DASH = new RegExp('[\u2013\u2014]')

describe('locales mobile : ponctuation', () => {
  it('ne contient aucun tiret long', () => {
    const offenders = localeFiles()
      .filter(({ content }) => LONG_DASH.test(content))
      .map(({ rel }) => rel)
    expect(offenders).toEqual([])
  })
})
