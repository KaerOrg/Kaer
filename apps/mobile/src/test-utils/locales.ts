// Helpers de lecture des fichiers de locale, partagés par les garde-fous qui
// vérifient le CONTENU des traductions (nommage d'un module, ponctuation).
//
// Ces garde-fous lisent le JSON depuis le disque plutôt que de l'importer : ils
// vérifient ce qui est écrit dans le fichier, y compris la ponctuation exacte, pas ce
// que le bundler en fait. Ce fichier vit hors de `__tests__/` parce que le preset
// jest-expo collecte tout `.ts` de ce dossier comme une suite de tests.

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// __dirname = apps/mobile/src/test-utils
export const LOCALES_DIR = join(__dirname, '..', 'i18n', 'locales')

export interface LocaleFile {
  /** Chemin relatif à `LOCALES_DIR`, ex. `fr/common.json`. */
  rel: string
  content: string
}

/** Tous les fichiers de locale du mobile, toutes langues et tous namespaces. */
export function localeFiles(): LocaleFile[] {
  const out: LocaleFile[] = []
  for (const lang of readdirSync(LOCALES_DIR)) {
    for (const file of readdirSync(join(LOCALES_DIR, lang))) {
      if (file.endsWith('.json')) {
        out.push({ rel: `${lang}/${file}`, content: readFileSync(join(LOCALES_DIR, lang, file), 'utf8') })
      }
    }
  }
  return out
}

/**
 * Bloc `modules.<moduleId>` d'un fichier de locale, ou `{}` s'il est absent.
 * Les valeurs sont typées à plat : seules les clés de premier niveau intéressent
 * ces garde-fous, un bloc peut porter des sous-objets hors périmètre.
 */
export function readModuleBlock(rel: string, moduleId: string): Record<string, string | undefined> {
  const raw = JSON.parse(readFileSync(join(LOCALES_DIR, rel), 'utf8')) as {
    modules?: Record<string, Record<string, string | undefined>>
  }
  return raw.modules?.[moduleId] ?? {}
}
