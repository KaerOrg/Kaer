import { describe, it, expect } from 'vitest'
import {
  depthOf, depthCounts, repertoire, contextByFamily, filterByRange, buildNamingTaxonomy,
  readIntensityMax, readContextCodes,
  CONTEXT_NONE, type EmotionNamingEntry, type NamingTaxonomy, type TaxonomyField,
} from './emotionNamingData'

/** Champ de config du module, tel que renvoyé par le moteur de modules. */
function configField(props: Record<string, string>): TaxonomyField {
  return { id: 'ew.cfg', field_type: 'tree_selector_config', text_code: null, props }
}

function entry(over: Partial<EmotionNamingEntry> = {}): EmotionNamingEntry {
  return {
    date: '2026-07-20T10:00:00Z',
    familyCode: null, nuanceCode: null, wordCode: null,
    intensity: null, context: [], contextOther: null, notes: null,
    ...over,
  }
}

const TAXONOMY: NamingTaxonomy = {
  families: ['fam.joy', 'fam.fear', 'fam.disgust'],
  nuancesByFamily: {
    'fam.joy': ['n.joy.pleasure', 'n.joy.love'],
    'fam.fear': ['n.fear.anxiety', 'n.fear.terror'],
    'fam.disgust': ['n.disgust.repulsion'],
  },
  wordsByNuance: {
    'n.joy.pleasure': ['w.a'],
    'n.joy.love': ['w.b', 'w.c'],
    'n.fear.anxiety': [],
    'n.fear.terror': [],
    'n.disgust.repulsion': [],
  },
  words: ['w.a', 'w.b', 'w.c'],
  colorByFamily: { 'fam.joy': '#EFC98A', 'fam.fear': '#AC9BDE', 'fam.disgust': '#AFBE8B' },
}

describe('depthOf', () => {
  it('renvoie « none » pour une entrée sans émotion nommée', () => {
    expect(depthOf(entry())).toBe('none')
  })

  it('renvoie « family » quand seule la famille est renseignée', () => {
    expect(depthOf(entry({ familyCode: 'fam.joy' }))).toBe('family')
  })

  it('renvoie « nuance » quand le patient s\'est arrêté à la nuance', () => {
    expect(depthOf(entry({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love' }))).toBe('nuance')
  })

  it('renvoie « word » seulement si un mot précis a été choisi', () => {
    const e = entry({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love', wordCode: 'w.a' })
    expect(depthOf(e)).toBe('word')
  })

  it('ne crédite PAS « word » à une nuance sans mots au choix', () => {
    // Décision #262 : « Solitude » n'a aucun mot au choix. Compter cette saisie comme
    // « mot précis » gonflerait la profondeur pour 16 nuances sur 37.
    const e = entry({ familyCode: 'fam.disgust', nuanceCode: 'n.disgust.repulsion' })
    expect(depthOf(e)).toBe('nuance')
  })
})

describe('depthCounts', () => {
  it('compte les quatre profondeurs', () => {
    const counts = depthCounts([
      entry(),
      entry({ familyCode: 'fam.joy' }),
      entry({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love' }),
      entry({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love', wordCode: 'w.a' }),
      entry({ familyCode: 'fam.fear', nuanceCode: 'n.fear.anxiety', wordCode: 'w.b' }),
    ])
    expect(counts).toEqual({ none: 1, family: 1, nuance: 1, word: 2 })
  })

  it('renvoie des zéros sans entrée', () => {
    expect(depthCounts([])).toEqual({ none: 0, family: 0, nuance: 0, word: 0 })
  })
})

describe('repertoire', () => {
  it('rend TOUTES les nuances, y compris celles jamais employées', () => {
    const rep = repertoire([entry({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love' })], TAXONOMY)
    const joy = rep.rows.find(r => r.familyCode === 'fam.joy')
    expect(joy?.cells).toEqual([
      { nuanceCode: 'n.joy.pleasure', count: 0 },
      { nuanceCode: 'n.joy.love', count: 1 },
    ])
  })

  it('garde une ligne entière pour une famille jamais employée', () => {
    // Cas de la famille Dégoût : sa ligne vide est le propos de l'écran.
    const rep = repertoire([entry({ familyCode: 'fam.joy' })], TAXONOMY)
    const disgust = rep.rows.find(r => r.familyCode === 'fam.disgust')
    expect(disgust).toBeTruthy()
    expect(disgust?.total).toBe(0)
  })

  it('totalise une famille par somme de ses nuances, jamais par moyenne', () => {
    const rep = repertoire([
      entry({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love' }),
      entry({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love' }),
      entry({ familyCode: 'fam.joy', nuanceCode: 'n.joy.pleasure' }),
    ], TAXONOMY)
    expect(rep.rows.find(r => r.familyCode === 'fam.joy')?.total).toBe(3)
  })

  it('compte la couverture sur les dénominateurs de la taxonomie reçue', () => {
    const rep = repertoire([
      entry({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love', wordCode: 'w.a' }),
      entry({ familyCode: 'fam.fear', nuanceCode: 'n.fear.anxiety' }),
    ], TAXONOMY)
    expect(rep).toMatchObject({
      familiesUsed: 2, familiesTotal: 3,
      nuancesUsed: 2, nuancesTotal: 5,
      wordsUsed: 1, wordsTotal: 3,
    })
  })

  it('ne compte pas deux fois la même nuance dans la couverture', () => {
    const rep = repertoire([
      entry({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love' }),
      entry({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love' }),
    ], TAXONOMY)
    expect(rep.nuancesUsed).toBe(1)
  })

  it('sur zéro entrée, rend la matrice complète à zéro', () => {
    const rep = repertoire([], TAXONOMY)
    expect(rep.rows).toHaveLength(3)
    expect(rep.rows.every(r => r.total === 0)).toBe(true)
    expect(rep.nuancesUsed).toBe(0)
  })

  it('bascule sur les mots précis sans changer les règles', () => {
    const rep = repertoire([
      entry({ familyCode: 'fam.joy', nuanceCode: 'n.joy.love', wordCode: 'w.b' }),
    ], TAXONOMY, 'word')
    const joy = rep.rows.find(r => r.familyCode === 'fam.joy')
    // Les mots des deux nuances de la famille, employés ou non.
    expect(joy?.cells).toEqual([
      { nuanceCode: 'w.a', count: 0 },
      { nuanceCode: 'w.b', count: 1 },
      { nuanceCode: 'w.c', count: 0 },
    ])
  })

  it('ignore une nuance disparue du seed sans casser la matrice', () => {
    const rep = repertoire([entry({ familyCode: 'fam.joy', nuanceCode: 'n.ghost' })], TAXONOMY)
    expect(rep.rows.flatMap(r => r.cells).every(c => c.count === 0)).toBe(true)
    // La couverture, elle, voit bien une nuance employée : la donnée n'est pas niée.
    expect(rep.nuancesUsed).toBe(1)
  })
})

describe('contextByFamily', () => {
  const CONTEXTS = ['ctx.work', 'ctx.family']
  const FAMILIES = ['fam.joy', 'fam.fear']

  it('croise contexte et famille en effectifs bruts', () => {
    const m = contextByFamily([
      entry({ familyCode: 'fam.joy', context: ['ctx.work'] }),
      entry({ familyCode: 'fam.joy', context: ['ctx.work'] }),
      entry({ familyCode: 'fam.fear', context: ['ctx.family'] }),
    ], CONTEXTS, FAMILIES)
    expect(m.cells['ctx.work']['fam.joy']).toBe(2)
    expect(m.cells['ctx.family']['fam.fear']).toBe(1)
    expect(m.cells['ctx.work']['fam.fear']).toBe(0)
  })

  it('range une saisie sans contexte déclaré dans « non renseigné »', () => {
    const m = contextByFamily([entry({ familyCode: 'fam.joy' })], CONTEXTS, FAMILIES)
    expect(m.cells[CONTEXT_NONE]['fam.joy']).toBe(1)
  })

  it('compte une saisie dans chacun de ses domaines déclarés', () => {
    const m = contextByFamily(
      [entry({ familyCode: 'fam.joy', context: ['ctx.work', 'ctx.family'] })],
      CONTEXTS, FAMILIES,
    )
    expect(m.cells['ctx.work']['fam.joy']).toBe(1)
    expect(m.cells['ctx.family']['fam.joy']).toBe(1)
    // La colonne, elle, ne double pas : c'est une seule saisie.
    expect(m.columnTotals['fam.joy']).toBe(1)
  })

  it('exclut les saisies sans émotion nommée et les compte à part', () => {
    const m = contextByFamily([
      entry({ familyCode: 'fam.joy', context: ['ctx.work'] }),
      entry(),
      entry(),
    ], CONTEXTS, FAMILIES)
    expect(m.wordlessCount).toBe(2)
    expect(m.columnTotals['fam.joy']).toBe(1)
  })

  it('somme des colonnes + sans mot = total de la fenêtre', () => {
    const entries = [
      entry({ familyCode: 'fam.joy', context: ['ctx.work'] }),
      entry({ familyCode: 'fam.fear' }),
      entry(),
    ]
    const m = contextByFamily(entries, CONTEXTS, FAMILIES)
    const columns = Object.values(m.columnTotals).reduce((a, b) => a + b, 0)
    expect(columns + m.wordlessCount).toBe(m.total)
  })

  it('sur zéro entrée, rend une matrice complète à zéro', () => {
    const m = contextByFamily([], CONTEXTS, FAMILIES)
    expect(m.total).toBe(0)
    expect(m.wordlessCount).toBe(0)
    expect(m.cells[CONTEXT_NONE]['fam.joy']).toBe(0)
  })
})

describe('buildNamingTaxonomy', () => {
  const FIELDS = [
    { id: 'ew.cfg', field_type: 'tree_selector_config', text_code: null },
    {
      id: 'ew.joy', field_type: 'tree_node', text_code: 'fam.joy',
      children: [
        {
          id: 'ew.joy.love', field_type: 'tree_node', text_code: 'n.joy.love',
          children: [
            { id: 'ew.joy.love.a', field_type: 'tree_node', text_code: 'w.a' },
            { id: 'ew.joy.love.b', field_type: 'tree_node', text_code: 'w.b' },
          ],
        },
        // Nuance sans mots au choix : elle compte, mais n'ajoute aucun mot.
        { id: 'ew.joy.calm', field_type: 'tree_node', text_code: 'n.joy.calm', children: [] },
      ],
    },
    { id: 'ew.footer', field_type: 'footer_note', text_code: 'footer' },
  ]

  it('ne retient que les nœuds d\'arbre, jamais la config ni le pied de page', () => {
    expect(buildNamingTaxonomy(FIELDS).families).toEqual(['fam.joy'])
  })

  it('range les nuances sous leur famille', () => {
    expect(buildNamingTaxonomy(FIELDS).nuancesByFamily).toEqual({
      'fam.joy': ['n.joy.love', 'n.joy.calm'],
    })
  })

  it('collecte les mots de tout l\'arbre, dénominateur non figé', () => {
    expect(buildNamingTaxonomy(FIELDS).words).toEqual(['w.a', 'w.b'])
  })

  it('supporte un arbre vide', () => {
    expect(buildNamingTaxonomy([])).toEqual({
      families: [], nuancesByFamily: {}, wordsByNuance: {}, words: [], colorByFamily: {},
    })
  })

  it('relève la teinte de chaque famille depuis ses props', () => {
    const fields = [{
      id: 'ew.joy', field_type: 'tree_node', text_code: 'fam.joy',
      props: { color: '#EFC98A' }, children: [],
    }]
    expect(buildNamingTaxonomy(fields).colorByFamily).toEqual({ 'fam.joy': '#EFC98A' })
  })

  it('groupe les mots sous leur nuance, pour la vue « mots précis »', () => {
    expect(buildNamingTaxonomy(FIELDS).wordsByNuance).toEqual({
      'n.joy.love': ['w.a', 'w.b'],
      'n.joy.calm': [],
    })
  })
})

describe('filterByRange', () => {
  const NOW = new Date('2026-07-30T12:00:00Z')

  it('garde les saisies dans la fenêtre', () => {
    const kept = filterByRange([
      entry({ date: '2026-07-29T12:00:00Z' }),
      entry({ date: '2026-06-01T12:00:00Z' }),
    ], 30, NOW)
    expect(kept).toHaveLength(1)
  })

  it('renvoie une liste vide quand rien n\'entre dans la fenêtre', () => {
    expect(filterByRange([entry({ date: '2020-01-01T00:00:00Z' })], 30, NOW)).toEqual([])
  })

  it('ne modifie pas la liste reçue', () => {
    const entries = [entry({ date: '2026-07-29T12:00:00Z' })]
    filterByRange(entries, 30, NOW)
    expect(entries).toHaveLength(1)
  })
})

describe('readIntensityMax', () => {
  it('lit la borne posee en config', () => {
    expect(readIntensityMax([configField({ intensity_max: '10' })])).toBe(10)
  })

  it('retombe sur le repli quand la config ne la porte pas', () => {
    expect(readIntensityMax([])).toBe(5)
    expect(readIntensityMax([configField({})])).toBe(5)
    expect(readIntensityMax([configField({ intensity_max: 'abc' })])).toBe(5)
  })

  it('accepte un repli explicite', () => {
    expect(readIntensityMax([], 7)).toBe(7)
  })
})

describe('readContextCodes', () => {
  it('collecte les domaines dans l ordre des cles indexees', () => {
    const fields = [configField({
      context_opt_2: 'ctx.family',
      context_opt_1: 'ctx.work',
      context_opt_3: 'ctx.money',
      intensity_max: '5',
    })]
    expect(readContextCodes(fields)).toEqual(['ctx.work', 'ctx.family', 'ctx.money'])
  })

  it('tolere un trou dans la numerotation', () => {
    const fields = [configField({ context_opt_1: 'ctx.work', context_opt_4: 'ctx.self' })]
    expect(readContextCodes(fields)).toEqual(['ctx.work', 'ctx.self'])
  })

  it('rend une liste vide quand aucune config n existe', () => {
    expect(readContextCodes([])).toEqual([])
  })
})