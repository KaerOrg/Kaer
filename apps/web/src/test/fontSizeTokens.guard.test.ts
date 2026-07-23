import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// ─── Garde-fou anti-régression — font-size piloté par le theme (issue #199) ─────
//
// L'échelle typographique vit dans `@kaer/shared` (`fontSize`) et est injectée en
// `rem` par `injectTheme()` sous forme de `--font-size-*`. Toute taille de police
// qui CORRESPOND à un palier de l'échelle DOIT passer par le token — jamais un
// `font-size: Npx` en dur. Ce test scanne le CSS web et échoue si une taille codée
// en dur est égale à une valeur de l'échelle (un token existe → on l'utilise).
//
// Les tailles d'affichage vraiment bespoke (hors échelle : gros scores SUDS 32/36px,
// emoji illustratifs 40px) restent autorisées : elles ne correspondent à aucun
// palier et sont annotées d'un commentaire dans leur CSS. Le jour où l'une devient
// récurrente, elle rejoint l'échelle (nouveau palier) puis ce garde-fou l'attrape.
//
// Doc : apps/web/docs/design-system.md § « Tokens » (échelle font-size).

const here = dirname(fileURLToPath(import.meta.url))
const webSrc = join(here, '..')

// Valeurs (px) de l'échelle `fontSize` — miroir de packages/shared/src/theme.ts.
// Une taille en dur égale à l'une d'elles est une violation : le token existe.
const TOKEN_PX: Record<number, string> = {
  11: '--font-size-xxs',
  12: '--font-size-xs',
  13: '--font-size-sm',
  14: '--font-size-caption',
  15: '--font-size-label',
  16: '--font-size-body',
  18: '--font-size-h3',
  22: '--font-size-h2',
  28: '--font-size-h1',
}

function cssFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...cssFiles(full))
    else if (entry.name.endsWith('.css')) out.push(full)
  }
  return out
}

// Capture chaque `font-size: <N>px` (N entier ou décimal), avec sa valeur numérique.
const FONT_SIZE_RE = /font-size:\s*([0-9]+(?:\.[0-9]+)?)px\b/g

interface Hit { file: string; line: number; px: number }

function collectHardcodedFontSizes(): Hit[] {
  const hits: Hit[] = []
  for (const file of cssFiles(webSrc)) {
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((raw, i) => {
      for (const m of raw.matchAll(FONT_SIZE_RE)) {
        hits.push({ file: file.slice(webSrc.length + 1), line: i + 1, px: Number(m[1]) })
      }
    })
  }
  return hits
}

describe('font-size — garde-fou piloté par le theme (CSS web)', () => {
  const hits = collectHardcodedFontSizes()

  it("aucun font-size en dur égal à un palier de l'échelle (utiliser le token)", () => {
    const offenders = hits
      .filter(h => h.px in TOKEN_PX)
      .map(h => `${h.file}:${h.line} → font-size: ${h.px}px (utiliser var(${TOKEN_PX[h.px]}))`)
    expect(offenders).toEqual([])
  })
})
