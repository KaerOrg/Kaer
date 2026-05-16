import type { SttProvider } from './interface.ts'
import { OpenAiProvider } from './openai.ts'
import { GladiaProvider } from './gladia.ts'

/**
 * Instancie le provider STT actif selon la variable d'environnement STT_PROVIDER.
 *
 * Valeurs acceptées : "gladia" (défaut) | "openai"
 *
 * Variables d'environnement requises par provider :
 *   gladia  → GLADIA_API_KEY  (+ STT_LANGUAGE optionnel, défaut "fr")
 *   openai  → OPENAI_API_KEY
 */
export function getProvider(): SttProvider {
  const name = (Deno.env.get('STT_PROVIDER') ?? 'gladia').toLowerCase()

  switch (name) {
    case 'gladia': {
      const key = Deno.env.get('GLADIA_API_KEY')
      if (!key) throw new Error('GLADIA_API_KEY not configured')
      const language = Deno.env.get('STT_LANGUAGE') ?? 'fr'
      return new GladiaProvider(key, language)
    }
    case 'openai': {
      const key = Deno.env.get('OPENAI_API_KEY')
      if (!key) throw new Error('OPENAI_API_KEY not configured')
      return new OpenAiProvider(key)
    }
    default:
      throw new Error(`Unknown STT_PROVIDER "${name}" — valid values: "gladia", "openai"`)
  }
}
