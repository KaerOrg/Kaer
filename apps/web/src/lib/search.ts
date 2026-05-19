const DIACRITIC_RE = /\p{Diacritic}/gu
const SPACE_RE = /\s+/

/** Lowercase + strip accents + trim. Pour comparer des chaînes utilisateur sans faux négatif sur les diacritiques. */
export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(DIACRITIC_RE, '').toLowerCase().trim()
}

/** Découpe une requête en tokens normalisés non-vides. */
export function tokenizeSearch(value: string): string[] {
  return normalizeSearch(value).split(SPACE_RE).filter(Boolean)
}

/** Vrai si chaque token est présent dans le haystack normalisé. */
export function matchesAllTokens(haystack: string, tokens: string[]): boolean {
  const normalized = normalizeSearch(haystack)
  return tokens.every(token => normalized.includes(token))
}
