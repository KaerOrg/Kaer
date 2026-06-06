import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // react-hooks/set-state-in-effect is part of the React Compiler ruleset (v7+).
      // This project does not use the React Compiler; the rule produces false positives
      // on standard async data-fetching effects (fetch → await → setState).
      'react-hooks/set-state-in-effect': 'off',
      // Interdit les callbacks inline dans le JSX (recréés à chaque render → cassent
      // React.memo, déclenchent des re-rendus). Voir coding-standards.md « Render — zéro
      // déclaration inline ». En 'warn' le temps de résorber l'existant (voir TODO.md),
      // puis à passer en 'error'. ignoreRefs: les callbacks de ref sont un usage légitime.
      'react/jsx-no-bind': ['warn', { ignoreRefs: true }],
    },
  },
  {
    // Les callbacks inline n'ont aucun enjeu de perf dans les tests — bruit inutile.
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'react/jsx-no-bind': 'off',
    },
  },
])
