import fs from 'fs'
import path from 'path'

// Garde-fou MDR 2017/745 : le texte d'un rappel de respiration est une CONSTANTE.
//
// Un module qui porte un objectif hebdomadaire est exactement celui où la tentation
// se présente : « plus qu'une session pour votre objectif », « vous n'avez pas
// pratiqué depuis 3 jours ». Ce serait une notification conditionnée par l'état des
// données, interdite par la règle d'or (invariant posé pour les vingt modules par
// #292, rappelé par le ticket M5 #370).
//
// Ce test échoue si une interpolation apparaît dans le titre ou le corps, et si le
// service se met à construire son message au lieu de le recevoir déjà traduit.

const LOCALES_DIR = path.join(__dirname, '..', 'i18n', 'locales')
const SERVICE = path.join(__dirname, '..', 'services', 'breathingReminderService.ts')

/** Les clés dont le contenu part dans une notification. */
const NOTIFICATION_KEYS = ['reminder_notification_title', 'reminder_notification_body'] as const

interface Locale {
  modules: Record<string, Record<string, string>>
}

function localeFiles(): string[] {
  return fs.readdirSync(LOCALES_DIR)
    .flatMap(lang => ['common.json', 'teen.json']
      .map(file => path.join(LOCALES_DIR, lang, file))
      .filter(fs.existsSync))
}

describe('garde-fou : le texte du rappel de respiration est une constante', () => {
  it('aucune interpolation dans le titre ni le corps, dans aucune locale', () => {
    const offenders: string[] = []
    for (const file of localeFiles()) {
      const locale = JSON.parse(fs.readFileSync(file, 'utf8')) as Locale
      const block = locale.modules?.breathing_techniques
      if (!block) continue
      for (const key of NOTIFICATION_KEYS) {
        const value = block[key]
        if (typeof value === 'string' && (value.includes('{{') || value.includes('}}'))) {
          offenders.push(`${path.relative(LOCALES_DIR, file)} → ${key} : ${value}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('le titre et le corps existent en fr et en en', () => {
    for (const lang of ['fr', 'en']) {
      const locale = JSON.parse(
        fs.readFileSync(path.join(LOCALES_DIR, lang, 'common.json'), 'utf8'),
      ) as Locale
      for (const key of NOTIFICATION_KEYS) {
        expect(locale.modules.breathing_techniques[key]).toBeTruthy()
      }
    }
  })

  it('le service ne compose pas son message : il le reçoit déjà traduit', () => {
    const source = fs.readFileSync(SERVICE, 'utf8')
    // Ni résolution i18n, ni gabarit, ni concaténation dans le contenu envoyé.
    expect(source).not.toMatch(/\bt\(/)
    expect(source).not.toMatch(/useTranslation/)
    expect(source).toMatch(/content: \{ title, body, data: REMINDER_DATA \}/)
  })

  it('le service ne lit aucune donnée de pratique', () => {
    const source = fs.readFileSync(SERVICE, 'utf8')
    for (const forbidden of [
      'fetchBreathingSessions', 'weekly_goal_sessions', 'currentStreak', 'sessionsInWeek',
    ]) {
      expect(source).not.toContain(forbidden)
    }
  })
})
