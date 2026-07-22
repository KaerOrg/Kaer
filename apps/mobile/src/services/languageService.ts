import AsyncStorage from '@react-native-async-storage/async-storage'

import { SUPPORTED } from '../i18n'

/**
 * Clé AsyncStorage : langue choisie explicitement par le patient dans son profil.
 * Absente tant qu'aucun choix n'a été fait — l'app retombe alors sur la langue
 * de l'appareil (`initialLanguage`).
 *
 * Préférence d'affichage locale : aucune donnée patient, donc pas de passage par
 * SQLite ni par `syncUpsert` (cf. `.claude/rules/sync-service.md`).
 */
const LANGUAGE_KEY = 'kaer.language'

/** Vrai si la valeur correspond à une langue embarquée dans les bundles i18n. */
export function isSupportedLanguage(lng: string): boolean {
  return (SUPPORTED as readonly string[]).includes(lng)
}

/**
 * Langue persistée, ou `null` si aucun choix explicite n'a été mémorisé.
 * Une valeur inconnue (bundle retiré depuis) est traitée comme absente.
 * Tolère une erreur AsyncStorage en renvoyant `null` — jamais bloquant au boot.
 */
export async function loadStoredLanguage(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY)
    if (stored === null || !isSupportedLanguage(stored)) return null
    return stored
  } catch {
    return null
  }
}

/** Mémorise la langue choisie par le patient. Non bloquant en cas d'échec. */
export async function persistLanguage(lng: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lng)
  } catch {
    // non bloquant — au pire la langue de l'appareil s'applique au prochain lancement
  }
}
