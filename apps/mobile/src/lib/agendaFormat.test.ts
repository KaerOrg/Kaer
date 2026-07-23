import { dayAbbrev, dayNumber, formatTime, formatLongDate } from './agendaFormat'

// Horodatage ancré à midi local pour éviter tout basculement de jour selon le fuseau
// de la machine de test. 2026-07-16 = un jeudi.
const THU_ISO = '2026-07-16T12:00:00'

describe('agendaFormat', () => {
  describe('dayAbbrev', () => {
    it('rend le jour abrégé en majuscules sans point (fr)', () => {
      expect(dayAbbrev(THU_ISO, 'fr-FR')).toBe('JEU')
    })
    it('rend le jour abrégé en majuscules (en)', () => {
      expect(dayAbbrev(THU_ISO, 'en-US')).toBe('THU')
    })
  })

  describe('dayNumber', () => {
    it('rend le numéro du jour du mois', () => {
      expect(dayNumber(THU_ISO)).toBe('16')
    })
  })

  describe('formatTime', () => {
    it("rend l'heure heures:minutes", () => {
      expect(formatTime('2026-07-16T14:30:00', 'fr-FR')).toMatch(/14.30/)
    })
  })

  describe('formatLongDate', () => {
    it('rend jour + numéro + mois', () => {
      const label = formatLongDate(THU_ISO, 'fr-FR')
      expect(label).toMatch(/16/)
      expect(label.toLowerCase()).toMatch(/juil/)
    })
  })
})
