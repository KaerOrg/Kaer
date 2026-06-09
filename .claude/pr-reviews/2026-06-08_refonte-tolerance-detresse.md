# PR Review — feat: compagnon de crise + admin user management
**Branch:** `refonte-tolerance-detresse` → PR #45  
**Date:** 2026-06-08  
**Reviewer:** Claude Sonnet 4.6  

---

## Merge `origin/main`

Merge effectué avant review. **2 conflits résolus** :
- `apps/mobile/src/i18n/locales/en/teen.json` — conflits additifs (clés distress_tolerance + exposure_hierarchy, HEAD gardé)
- `apps/web/src/components/features/ModulePreviewPanel/ModulePreviewPanel.css` — blocs `.cc-*` (crisis_companion) et `.ej-*` (exposure_journey) intercalés, les deux reconstruits en entier

---

## CI — résultats

| Job | Statut |
|---|---|
| typecheck-web | ✅ |
| lint-web | ✅ |
| test-web | ✅ |
| typecheck-mobile | ✅ |
| test-mobile | ✅ |

---

## 🔴 Violations bloquantes (1)

### 1. `apps/mobile/src/i18n/locales/en/teen.json` — clé `disclaimer` manquante

**Règle violée :** CLAUDE.md § Internationalisation — parité fr/en teen.json obligatoire.

`fr/teen.json` contient `modules.distress_tolerance.disclaimer` (ligne 825), `en/teen.json` ne l'a pas.

```json
// fr/teen.json ✅
"distress_tolerance": {
  "disclaimer": "Ce module est un support à tes consultations...",
  "tab_fiches": "Comprendre",
  "tab_now": "Agir en crise",
  "now": { ... }
}

// en/teen.json ❌ — disclaimer absent
"distress_tolerance": {
  "tab_fiches": "Understand",
  "tab_now": "Act in a crisis",
  "now": { ... }
}
```

**Fix :** ajouter dans `en/teen.json` :
```json
"disclaimer": "This module supports your therapy sessions. The techniques were introduced with your clinician — it does not replace your therapeutic follow-up."
```

---

## 🟡 Violations non-bloquantes (1)

### 2. `apps/mobile/src/components/features/ModuleRenderer/layouts/CrisisCompanion/styles.ts` — blocs shadow codés en dur

**Règle violée :** coding-standards.md § "Design system mobile — Shadows — toujours via les tokens `shadows.sm/md`".

4 composants ont des blocs shadow copiés en dur au lieu d'utiliser les tokens :

```ts
// ❌ Lignes 10-11 (introCard), 33 (categoryCard), 44-45 (activityCard), 82-83 (doneCard)
shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2

// ✅
import { shadows, colors } from '../../../../../theme'
// puis dans les styles :
...shadows.sm,                   // remplace le bloc shadow
shadowColor: colors.black,       // si le token colors.black existe
```

Impact : incohérence cosmétique (valeurs divergent si le thème change). Non bloquant car aucun test ne régresse.

---

## 🔵 Points d'attention (3)

### 3. `apps/web/src/services/patientRefService.ts:20` — cast de type Supabase

```ts
const { data } = await supabase
  .from('practitioner_patients')
  .select('patient_id')
  .eq('public_ref', ref)
  .single() as { data: { patient_id: string } | null }  // ← cast manuel
```

Le cast n'est pas `as any` (acceptable), mais court-circuite `database.types.ts`. À migrer vers le type généré quand la colonne `public_ref` sera intégrée dans le fichier de types. Aucune urgence.

### 4. `apps/web/src/pages/AdminUsersPage/AdminUsersPage.css:41` — `width: 260px` en dur

```css
.admin-users__filters .search-input {
  width: 260px;  /* ← hardcodé */
}
```

Pas de token de largeur pour cette contrainte de layout. Minor : pas d'équivalent `var(--spacing-*)` applicable, mais à documenter (ou ajouter un token `--input-width-filter`) si d'autres pages en ont besoin.

### 5. `apps/web/src/components/features/ModuleRenderer/layouts/CrisisCompanionLayout/CrisisCompanionLayout.tsx:41` — `ui()` déclaré inline

```ts
// Déclarée dans le corps du composant sans useMemo
const ui = (key: string): string => t(`modules.${moduleId}.now.${key}`)
```

Recréée à chaque render. Non propagée à des enfants → pas de re-render parasite. Acceptable ici (pattern courant des layouts web), mais techniquement viole "zéro déclaration inline". `useCallback` serait plus cohérent.

---

## ✅ Positifs

### Sécurité admin — double barrière correctement implémentée
- `practitioners.is_admin` en lecture seule côté client via `trg_guard_is_admin_write` ✅
- `fn_is_admin()` re-vérifié dans chaque RPC (`admin_list_users`, `erase_patient_data`, etc.) ✅
- Front gate (`App.tsx:72`) documentée comme UX uniquement ✅
- Edge function `delete-patient-account` : identité du caller depuis JWT, jamais le payload ; `service_role` limité à l'opération de suppression ✅

### MDR 2017/745 — `crisis_companion`
- Minuteur fixe choisi par le patient (pas déclenché par des données cliniques) ✅
- Écran de fin neutre ("La vague est passée") sans jugement ni conseil ✅
- Zéro persistance SQLite ou Supabase ✅
- Config-first : catégories et activités issus de `module_content_fields` (seed.sql), pas de tableau TypeScript statique ✅

### Design system
- `AdminUsersTable` câble `DataTable`, `SearchInput`, `SegmentedControl`, `SelectField`, `StatusBadge`, `EmptyState` — zéro composant réinventé ✅
- `AdminUsersPage.css` : 100 % `var(--*)` (couleurs, tailles, spacing) ✅
- `PatientDataRights` réutilisé dans `AdminUserDetail` pour les patients ✅

### i18n
- Clés `distress_tolerance.now.*` présentes dans fr/common, en/common, fr/teen, en/teen ✅
- Parité fr/en web `admin_users.*` : 0 clé manquante ✅
- Clés `crisis.*` (ancien implémentation) présentes en fr/common uniquement mais non référencées dans le code → orphelines, sans impact fonctionnel

### Architecture
- `LoadState` discriminated union à niveau module dans `AdminUsersPage` ✅
- `handleErased` : mise à jour optimiste via `setState` fonctionnel — pas de rechargement réseau ✅
- `resolvePatientRef` + migration `public_ref` idempotente (`schema.sql:299-313`) ✅
- `crisisLogic.ts` : fonctions pures, zero React, testables en isolation ✅
- Timer `useEffect` avec `clearInterval` cleanup ✅

### Tests
- `adminService.test.ts` : 3 tests (happy path, non-admin, null data) ✅
- `AdminUsersPage.test.tsx` : 5 tests (liste, erreur, filtre type, filtre praticien, effacement) ✅
- `CrisisCompanionLayout.test.tsx` (web) : 3 tests (render+catégories, durées+fin neutre, 0 catégories) ✅
- `CrisisCompanionLayout.test.tsx` (mobile) : 5 tests (états machine, timer, fin) ✅
- `sortUsers.test.ts` : 2 tests ✅
- `crisisLogic.test.ts` : 4 suites ✅
- `patientRefService.test.ts` : 5 tests ✅

---

## Checklist finale

- [x] CI : tous les jobs passent
- [x] Merge `origin/main` effectué, conflits résolus
- [ ] **Fix requis avant merge** : ajouter `disclaimer` dans `en/teen.json` (distress_tolerance)
- [ ] Recommandé : remplacer les blocs shadow inline par `...shadows.sm` dans `styles.ts`
- [x] Tests unitaires complets
- [x] Pas de `as any` / `@ts-ignore` / inline style hardcodé (hors shadow)
- [x] Sécurité admin : double barrière front + DB
- [x] MDR 2017/745 conforme

---

**Résumé :** 1 violation bloquante (parité en/teen.json), 1 non-bloquante (shadows hardcodés), 3 points d'attention mineurs. La PR est solide sur tous les aspects critiques (sécurité, MDR, architecture, tests). Corriger la clé `disclaimer` dans `en/teen.json` avant merge.
