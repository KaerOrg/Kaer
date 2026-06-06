// Garde-fou contre la régression du 06/06/2026 : DEUX copies de React dans le
// monorepo (19.1.0 à la racine, 19.2.7 nichée dans apps/mobile/node_modules à
// cause d'un range `^`). Le renderer react-native utilisait une copie, les
// composants de l'app l'autre → dispatcher de hooks null → crash au démarrage
// « Cannot read property 'useState' of null ».
//
// Ce test vise la CAUSE (état des dépendances), pas le symptôme (rendu d'un
// composant). Il lit les package.json sur le disque avec `fs` — volontairement
// sans `require.resolve` (le résolveur de Jest, avec son moduleNameMapper,
// fausserait la mesure de l'état réel d'installation).
//
// Maintenance : si la version de React du projet change (montée d'Expo / RN),
// mettre à jour la version épinglée dans les 3 endroits (racine dependencies,
// racine overrides, mobile dependencies) — ce test vérifie qu'ils restent alignés.

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

interface PackageJson {
  dependencies?: Record<string, string>
  overrides?: Record<string, string>
  version?: string
}

function readJson(path: string): PackageJson {
  return JSON.parse(readFileSync(path, 'utf-8')) as PackageJson
}

// __dirname = apps/mobile/src/__tests__
const MOBILE_PKG = resolve(__dirname, '../../package.json')
const REPO_ROOT = resolve(__dirname, '../../../..')
const ROOT_PKG = resolve(REPO_ROOT, 'package.json')
const ROOT_REACT_PKG = resolve(REPO_ROOT, 'node_modules/react/package.json')
const MOBILE_NESTED_REACT_PKG = resolve(__dirname, '../../node_modules/react/package.json')

// Version exacte : ni `^`, ni `~`, ni `*`, ni plage — uniquement X.Y.Z.
const EXACT_VERSION = /^\d+\.\d+\.\d+$/

describe('React — copie unique dans le monorepo', () => {
  const root = readJson(ROOT_PKG)
  const mobile = readJson(MOBILE_PKG)

  it('react est épinglé en version EXACTE (pas de ^ ou ~ qui ferait dériver npm)', () => {
    // Doit être exact (ex. "19.1.0"), pas une plage type "^19.1.0".
    expect(root.dependencies?.react ?? '').toMatch(EXACT_VERSION)
    expect(mobile.dependencies?.react ?? '').toMatch(EXACT_VERSION)
  })

  it('racine, mobile et overrides déclarent la MÊME version de react', () => {
    const rootReact = root.dependencies?.react
    expect(mobile.dependencies?.react).toBe(rootReact)
    // La racine doit avoir un overrides.react aligné (garde-fou anti-dérive).
    expect(root.overrides?.react).toBe(rootReact)
  })

  it('la version installée à la racine correspond à la version déclarée', () => {
    const installed = readJson(ROOT_REACT_PKG).version
    expect(installed).toBe(root.dependencies?.react)
  })

  it('AUCUNE copie de react n’est nichée dans apps/mobile/node_modules (doit être hoistée)', () => {
    // Si ce fichier existe, c’est qu’une 2ᵉ copie de React a été installée dans
    // l’espace mobile → exactement le bug à empêcher. Correctif : npm install.
    const nestedVersion = existsSync(MOBILE_NESTED_REACT_PKG)
      ? readJson(MOBILE_NESTED_REACT_PKG).version
      : null
    expect(nestedVersion).toBeNull()
  })
})
