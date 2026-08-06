import { formatReminderDays, toggleReminderDay, DISPLAY_WEEK_JS_DAYS } from './weekDayOrder'

const LABELS = ['L', 'M', 'Me', 'J', 'V', 'S', 'D']

describe('formatReminderDays', () => {
  it('rend « tous les jours » quand les sept jours sont cochés', () => {
    expect(formatReminderDays([...DISPLAY_WEEK_JS_DAYS], LABELS, 'tous les jours')).toBe('tous les jours')
  })

  it('rend les initiales dans l’ordre d’affichage, pas dans l’ordre stocké', () => {
    // 0 = dimanche : stocké en tête, il doit s'afficher en fin de semaine.
    // 1 = lundi, 3 = mercredi.
    expect(formatReminderDays([0, 1, 3], LABELS, 'tous les jours')).toBe('L · Me · D')
  })

  it('rend une chaîne vide sans jour coché', () => {
    expect(formatReminderDays([], LABELS, 'tous les jours')).toBe('')
  })

  it('rend un seul jour sans séparateur', () => {
    expect(formatReminderDays([2], LABELS, 'tous les jours')).toBe('M')
  })
})

describe('toggleReminderDay', () => {
  it('ajoute un jour absent en gardant l’ordre croissant', () => {
    expect(toggleReminderDay([1, 5], 3)).toEqual([1, 3, 5])
  })

  it('retire un jour déjà présent', () => {
    expect(toggleReminderDay([1, 3, 5], 3)).toEqual([1, 5])
  })

  it('ajoute dimanche (0) en tête de la liste stockée', () => {
    expect(toggleReminderDay([2], 0)).toEqual([0, 2])
  })

  it('ne mute pas le tableau reçu', () => {
    const days = [1, 2]
    toggleReminderDay(days, 4)
    expect(days).toEqual([1, 2])
  })
})
