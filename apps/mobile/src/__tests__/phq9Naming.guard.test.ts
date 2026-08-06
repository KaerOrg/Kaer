// ─── Garde-fou : le module `phq9` s'appelle « Mon humeur ces 2 semaines » ─────
//
// Ticket #405 (Q-1), Epic #404 : le module s'affichait sous le seul sigle « PHQ-9 »,
// sans sous-titre, là où SNAP-IV et EPDS en avaient un. Il porte désormais un nom en
// clair et un sous-titre qui annonce le format, « Questionnaire PHQ-9 · 10 questions,
// 4 min ». Le sigle reste, en second rang : c'est ainsi que le praticien le nomme en
// consultation.
//
// L'identifiant technique `phq9` ne bouge pas : c'est une clé de persistance
// (`scale_entries.scale_id`, `module_content_fields.module_id`, `SCALE_SCORING`).
//
// Ce test verrouille les critères d'acceptation du ticket qui ne se voient pas dans un
// test de rendu : la valeur exacte servie langue par langue, l'annonce de 10 questions
// et non 9, l'absence de titre de soignant en dur, et l'interdiction d'ajouter du
// contenu psychométrique dans `teen.json` (§ Droit d'auteur de l'Epic). Un fichier de
// locale de 2000+ lignes se dérègle facilement à un merge : d'où la garde.

import { readModuleBlock } from '../test-utils/locales'

const readModule = (rel: string) => readModuleBlock(rel, 'phq9')

describe('phq9 : renommage « Mon humeur ces 2 semaines » (#405)', () => {
  it('sert le nom en clair et le sous-titre en fr', () => {
    const fr = readModule('fr/common.json')
    expect(fr.label).toBe('Mon humeur ces 2 semaines')
    expect(fr.description).toBe('Questionnaire PHQ-9 · 10 questions, 4 min')
  })

  it('sert le nom en clair et le sous-titre en en', () => {
    const en = readModule('en/common.json')
    expect(en.label).toBe('My mood over the past 2 weeks')
    expect(en.description).toBe('PHQ-9 questionnaire · 10 questions, 4 min')
  })

  it('traduit le nom et le sous-titre en de, es, it et pt (best-effort)', () => {
    for (const lang of ['de', 'es', 'it', 'pt']) {
      const block = readModule(`${lang}/common.json`)
      expect(block.label).toBeDefined()
      expect(block.label).not.toBe('PHQ-9')
      expect(block.description).toContain('PHQ-9')
    }
  })

  it('annonce 10 questions et non 9 dans le sous-titre, toutes langues', () => {
    // L'item 10 (retentissement fonctionnel) est introduit par #410. Le nombre
    // annoncé au patient est 10 dès maintenant : la distinction 9 + 1 relève du
    // scoring interne, pas de ce qu'on lui demande de remplir (décision 12).
    for (const lang of ['fr', 'en', 'de', 'es', 'it', 'pt']) {
      const description = readModule(`${lang}/common.json`).description ?? ''
      expect(description).toMatch(/\b10\b/)
      expect(description).not.toMatch(/\b9 (questions|Fragen|preguntas|domande|perguntas)\b/)
    }
  })

  it('ne préfixe aucune chaîne du module par un titre de soignant', () => {
    // Les utilisateurs sont psychologues, IDE, IPA, médecins : « Dr Untel » est faux
    // pour la majorité d'entre eux. La convention est le nom d'affichage saisi par le
    // praticien, ou « votre soignant » quand il n'y a pas de nom à insérer.
    const offenders: string[] = []
    for (const lang of ['fr', 'en', 'de', 'es', 'it', 'pt']) {
      for (const [key, value] of Object.entries(readModule(`${lang}/common.json`))) {
        if (typeof value === 'string' && /\bDr\.?\s/.test(value)) {
          offenders.push(`${lang}/common.json → modules.phq9.${key}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('ne surcharge aucun contenu psychométrique dans teen.json', () => {
    // Une échelle validée ne se reformule pas, pas même pour la tutoyer : le mode ado
    // retombe sur la version de `common` par le fallback i18next. Seul l'habillage
    // applicatif peut avoir une variante teen.
    const PSYCHOMETRIC = /^(q\d+|opt_\d+|instructions?_?\d*|legend_.*|section_.*|warning)$/
    for (const rel of ['fr/teen.json', 'en/teen.json']) {
      const keys = Object.keys(readModule(rel)).filter(k => PSYCHOMETRIC.test(k))
      expect(keys).toEqual([])
    }
  })
})
