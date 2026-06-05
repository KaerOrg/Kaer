# Pièges de dépendances — Monorepo Kær

## Contexte

Monorepo npm workspaces avec deux versions de React qui doivent coexister :

| Package | Version React | Raison |
|---|---|---|
| `apps/mobile` | `19.1.0` | Figée — imposée par `react-native-renderer` embarqué dans react-native |
| `apps/web` | `^19.2.4` | Version courante, compatible avec les derniers outils |
| Root (hoistée depuis web) | `19.2.x` + `react-dom@19.2.x` | Accessible à `@testing-library/react` hoisé à la racine |

---

## Problème 1 — `react-native-renderer` impose une version exacte de React

`react-native` embarque son propre renderer (`react-native-renderer`) compilé pour une version **exacte** de React. Si `react` à la racine passe à 19.2.x alors que mobile déclare 19.1.0, les tests mobile plantent immédiatement :

```
Incompatible React versions: "react" 19.2.5 vs "react-native-renderer" 19.1.0
```

**Règle** : ne jamais modifier la version de `react` dans `apps/mobile/package.json` sans s'assurer que la version de `react-native` embarque un renderer compatible.

---

## Problème 2 — Deux instances React dans le même processus = hooks cassés

npm workspaces hoise les paquets à la racine quand les versions sont compatibles. Si deux copies de `react` coexistent dans le même processus Jest ou Vite (une depuis root, une depuis un workspace), tous les hooks (`useState`, `useContext`…) échouent :

```
Cannot read properties of null (reading 'useContext')
```

**Cause typique** : `@testing-library/react` ou `@testing-library/react-native` est hoisé à la racine et résout `react` depuis root, pendant que les composants testés utilisent une copie locale différente.

---

## Solution en place (à ne pas casser)

### 1. Root `package.json` — fournir react-dom à la racine

```json
"devDependencies": {
  "react": "^19.2.4",
  "react-dom": "^19.2.4"
}
```

npm hoise `react@19.2.x` et `react-dom@19.2.x` à la racine. Cela rend `react-dom/test-utils` accessible pour `@testing-library/react` (lui aussi hoisé à la racine). Sans ça, les tests web échouent avec `Cannot find module 'react-dom/test-utils'`.

### 2. `apps/mobile/package.json` — forcer Jest à utiliser react@19.1.0

```json
"jest": {
  "moduleNameMapper": {
    "^react$": "<rootDir>/node_modules/react",
    "^react/(.*)$": "<rootDir>/node_modules/react/$1"
  }
}
```

Force Jest à résoudre `react` (et ses sous-chemins comme `react/jsx-runtime`) depuis `apps/mobile/node_modules/react@19.1.0` pour **tous** les modules du processus de test, y compris `@testing-library/react-native` hoisé à la racine. Sans ça, `@testing-library/react-native` utilise le react@19.2.x de la racine = deux instances = crash.

### 3. `apps/web/vite.config.ts` — dédupliquer React dans Vite

```typescript
resolve: {
  dedupe: ['react', 'react-dom'],
},
```

Empêche Vite de charger plusieurs copies de React lors des tests web. Les alias manuels (ex. `react → apps/web/node_modules/react`) sont inutiles et **dangereux** car `apps/web` n'a plus sa propre copie locale (tout est hoisé vers la racine).

---

## Ce qu'il ne faut PAS faire

| Action | Conséquence |
|---|---|
| Mettre `"overrides": {"react": "^19.2.4"}` dans root | N'affecte pas les dépendances directes des workspaces — `apps/mobile` garde `react@19.1.0` |
| Changer `apps/mobile/package.json` → `"react": "^19.2.4"` | Mobile passe à 19.2.x, `react-native-renderer` (19.1.0) incompatible → crash tests mobile |
| Supprimer `react`/`react-dom` de root `devDependencies` | `react-dom` disparaît de root → `@testing-library/react` ne trouve plus `react-dom/test-utils` → crash tests web |
| Supprimer les entrées `react` du `moduleNameMapper` mobile | `@testing-library/react-native` utilise root's react@19.2.x au lieu de 19.1.0 → deux instances → crash |
| Ajouter des alias Vite vers `apps/web/node_modules/react` | Ce dossier n'existe plus (react est hoisé) → Vite ne peut pas résoudre `react/jsx-dev-runtime` → crash tests web |

---

## Vérification rapide de l'état attendu

```bash
# root : react 19.2.x + react-dom 19.2.x
node -e "console.log(require('./node_modules/react/package.json').version)"
node -e "console.log(require('./node_modules/react-dom/package.json').version)"

# mobile : copie locale isolée à 19.1.0
node -e "console.log(require('./apps/mobile/node_modules/react/package.json').version)"

# web : pas de copie locale (hoistée vers root)
ls apps/web/node_modules/react 2>/dev/null || echo "OK — pas de copie locale"
```

```bash
# Les deux suites doivent passer à 0 échec
npm run test:web
npm run test:mobile
```
