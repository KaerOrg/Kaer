import { splitTokens, hasToken, toggleToken } from './textSuggestions'

describe('textSuggestions', () => {
  it('splitTokens découpe sur la virgule et ignore les vides', () => {
    expect(splitTokens('anxiété, colère,  , tristesse')).toEqual(['anxiété', 'colère', 'tristesse'])
    expect(splitTokens('')).toEqual([])
  })

  it('hasToken détecte un mot exact, pas une sous-chaîne', () => {
    expect(hasToken('anxiété, colère', 'colère')).toBe(true)
    expect(hasToken('très anxieux', 'anxieux')).toBe(false)
  })

  it('toggleToken ajoute un mot absent', () => {
    expect(toggleToken('', 'anxiété')).toBe('anxiété')
    expect(toggleToken('colère', 'anxiété')).toBe('colère, anxiété')
  })

  it('toggleToken retire un mot présent sans toucher au reste', () => {
    expect(toggleToken('anxiété, colère', 'anxiété')).toBe('colère')
  })

  it('toggleToken préserve le texte libre du patient', () => {
    expect(toggleToken('un peu perdu', 'anxiété')).toBe('un peu perdu, anxiété')
    expect(toggleToken('un peu perdu, anxiété', 'anxiété')).toBe('un peu perdu')
  })
})
