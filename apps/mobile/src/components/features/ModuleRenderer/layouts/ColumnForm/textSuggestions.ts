// Chips de suggestions d'un `column_text_field` (props `suggestion_1..n`) :
// aide au vocabulaire, PAS une taxonomie imposée. Le patient tape ou écrit
// librement ; une chip ajoute/retire son mot dans le champ (auto-étiquetage,
// aucune détection automatique — MDR 2017/745).

const SEPARATOR = ', '

export function splitTokens(value: string): string[] {
  return value
    .split(',')
    .map(token => token.trim())
    .filter(token => token.length > 0)
}

export function hasToken(value: string, token: string): boolean {
  return splitTokens(value).includes(token)
}

/** Ajoute le mot s'il est absent, le retire s'il est présent (texte libre préservé). */
export function toggleToken(value: string, token: string): string {
  const tokens = splitTokens(value)
  const next = tokens.includes(token)
    ? tokens.filter(t => t !== token)
    : [...tokens, token]
  return next.join(SEPARATOR)
}
