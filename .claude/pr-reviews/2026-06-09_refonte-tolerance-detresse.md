---
date: 2026-06-09
branch: refonte-tolerance-detresse
pr_number: 45
pr_url: https://github.com/KaerOrg/Kaer/pull/45
ci_pass: false
merge_clean: true
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 0
  tests: 1
  docs: 0
  design_system: 1
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
warnings: 4
files_created: 26
files_modified: 60
rules_enriched: 1
---

# PR Review — refonte-tolerance-detresse
Date : 2026-06-09

## CI GitHub Actions

| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (185 warnings, 0 errors) |
| test-web | `cd apps/web && npx vitest run` | ✅ 628 passed |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ⚠️ 33 failures dans 5 suites (voir violation #1) |

## Synchronisation avec main

- Merge `origin/main` : propre (already up to date)
- Fichiers en conflit résolus : aucun

## Fichiers analysés

- Créés : 26 fichiers
- Modifiés : ~60 fichiers

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 2 |
| ⚠️ Points d'attention | 4 |
| ✅ Fichiers conformes | Large majorité |

---

## 🚫 Violations bloquantes

### 1. Tests mobiles cassés — 5 suites

**Fichiers concernés :**
- `apps/mobile/src/components/features/ModuleRenderer/fields/InlineText/InlineText.test.tsx:7`
- `apps/mobile/src/components/features/ModuleRenderer/fields/CardDefinition/CardDefinition.test.tsx`
- `apps/mobile/src/components/features/ModuleRenderer/fields/FieldRow/FieldRow.test.tsx`
- `apps/mobile/src/components/features/ModuleRenderer/fields/FieldListItem/FieldListItem.test.tsx`
- `apps/mobile/src/components/features/ModuleRenderer/fields/FieldText/FieldText.test.tsx`

**Cause :** commit `ef991e6` a renommé `useModuleT` → `useModuleTranslation`, mocks non mis à jour.

```ts
// ❌ mock encore l'ancien nom
jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleT: () => (key: string) => key,
}))
// ✅ correction
jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (key: string) => key,
}))
```

---

### 2. CSS `cc-*` — valeurs px en dur dans `ModulePreviewPanel.css`

Lignes 3480-3591 : `18px`, `13px`, `12px`, `10px`, `8px`, `6px`, `4px`, `14px`, `15px`, `64px`, `32px`, `42px`… à remplacer par `var(--font-size-*)`, `var(--spacing-*)`, `var(--radius-*)`.

---

## ⚠️ Points d'attention

1. `patientRefService.ts:20` — cast `as { data: ... }` qui ignore l'error Supabase → préférer destructuration + gestion explicite de `error`
2. `AdminUsersTable.tsx:149` — callback inline `onChange={e => setPractitioner(e.target.value)}` → `useCallback`
3. `crisis_companion` absent de `SELF_MANAGED_LAYOUTS` dans `ModuleContentScreen.tsx` — OK pour l'usage actuel (via `tabbed`), mais ScrollView imbriqué si utilisé en top-level direct
4. `apps/mobile/docs/design-system.md` non mis à jour pour le prop `testID` ajouté à `Button` et `Card`

---

## ✅ Points positifs

- Architecture admin exemplaire (fn_is_admin SECURITY DEFINER + REVOKE + trigger)
- CrisisCompanionLayout mobile refactorisé avec Card + Button ✓ (14/14 tests)
- Tests : adminService (3), sortUsers (2), patientRefService (5), CrisisCompanionLayout (5+3+14), AdminUsersPage (5)
- Seed idempotent, toutes les valeurs visibles = clés i18n ✓
- Parité teen.json fr/en pour distress_tolerance ✓
- Documentation complète (4 nouvelles specs + services/modules/database mis à jour)
- MDR 2017/745 conforme
