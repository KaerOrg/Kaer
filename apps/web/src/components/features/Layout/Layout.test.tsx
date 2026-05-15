import { getInitials } from './Layout.utils'

describe('getInitials', () => {
  it("retourne les initiales d'un nom complet", () => {
    expect(getInitials('Marie Dupont')).toBe('MD')
  })

  it('retourne une seule initiale pour un prénom seul', () => {
    expect(getInitials('Marie')).toBe('M')
  })

  it('prend au maximum 2 initiales', () => {
    expect(getInitials('Jean Paul Martin')).toBe('JP')
  })

  it('gère un email comme fallback', () => {
    expect(getInitials('marie@example.com')).toBe('M')
  })

  it('retourne "?" pour une chaîne vide', () => {
    expect(getInitials('?')).toBe('?')
  })
})
