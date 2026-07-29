// ─── Garde-fou : le module `emotion_wheel` s'appelle « Nommer ce que je ressens » ──
//
// Ticket #249 (K-1) : le titre « Roue des émotions » promettait une roue que l'app
// n'affiche pas, et la description réduisait le module à la seule alexithymie. Le
// module est renommé « Nommer ce que je ressens » / « Mettre un mot précis sur ce que
// vous ressentez. ». L'identifiant technique `emotion_wheel` ne bouge pas.
//
// Ce test verrouille les deux critères d'acceptation du ticket :
//   1. plus AUCUNE occurrence de l'ancien nom dans les textes patient mobile ;
//   2. le nouveau libellé et la nouvelle description sont bien servis en fr et en.
//
// L'ancien nom se réintroduit facilement par un merge sur un fichier de locale de
// 2000+ lignes : d'où la garde plutôt qu'une simple relecture.

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// __dirname = apps/mobile/src/__tests__
const LOCALES_DIR = join(__dirname, '..', 'i18n', 'locales')

// Anciens libellés du module, langue par langue. « Feeling Wheel (Willcox, 1982) »
// n'est PAS dans cette liste : c'est le nom de l'instrument d'origine, cité en
// source, et il doit rester.
const LEGACY_NAMES = [
  'Roue des émotions',
  'Emotion wheel',
  'Gefühlsrad',
  'Rueda de emociones',
  'Ruota delle emozioni',
  'Roda das emoções',
]

function localeFiles(): { rel: string; content: string }[] {
  const out: { rel: string; content: string }[] = []
  for (const lang of readdirSync(LOCALES_DIR)) {
    const dir = join(LOCALES_DIR, lang)
    for (const file of readdirSync(dir)) {
      if (file.endsWith('.json')) {
        out.push({ rel: `${lang}/${file}`, content: readFileSync(join(dir, file), 'utf8') })
      }
    }
  }
  return out
}

function readModule(rel: string): Record<string, string> {
  const raw = JSON.parse(readFileSync(join(LOCALES_DIR, rel), 'utf8')) as {
    modules?: Record<string, Record<string, string>>
  }
  return raw.modules?.emotion_wheel ?? {}
}

describe('emotion_wheel : renommage « Nommer ce que je ressens » (#249)', () => {
  it('ne laisse aucune occurrence de l’ancien nom dans les locales mobile', () => {
    const offenders: string[] = []
    for (const { rel, content } of localeFiles()) {
      for (const legacy of LEGACY_NAMES) {
        if (content.includes(legacy)) offenders.push(`${rel} → « ${legacy} »`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('sert le nouveau libellé et la nouvelle description en fr', () => {
    const fr = readModule('fr/common.json')
    expect(fr.label).toBe('Nommer ce que je ressens')
    expect(fr.description).toBe('Mettre un mot précis sur ce que vous ressentez.')
    expect(fr.title).toBe('Nommer ce que je ressens')
  })

  it('sert le nouveau libellé et la nouvelle description en en', () => {
    const en = readModule('en/common.json')
    expect(en.label).toBe('Naming what I feel')
    expect(en.description).toBe('Put a precise word on what you feel.')
    expect(en.title).toBe('Naming what I feel')
  })

  it('donne une variante teen tutoyée à la description, fr et en', () => {
    expect(readModule('fr/teen.json').description).toBe(
      'Mettre un mot précis sur ce que tu ressens.',
    )
    expect(readModule('en/teen.json').description).toBe('Find the exact word for what you feel.')
  })

  it('laisse le nom du module retomber sur common en mode ado (un seul nom)', () => {
    // Le nom est déjà à la première personne : une surcharge teen ne ferait que
    // dupliquer la chaîne et ouvrir la porte à deux noms pour un même module.
    expect(readModule('fr/teen.json').title).toBeUndefined()
    expect(readModule('en/teen.json').title).toBeUndefined()
    expect(readModule('fr/teen.json').label).toBeUndefined()
  })
})
