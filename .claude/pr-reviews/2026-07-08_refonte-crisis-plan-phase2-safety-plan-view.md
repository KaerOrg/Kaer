---
date: 2026-07-08
branch: refonte/crisis-plan-phase2-safety-plan-view
pr_number: null
pr_url: null
ci_pass: true
merge_clean: true
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 0
  tests: 0
  docs: 0
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
warnings: 3
files_created: 8
files_modified: 27
rules_enriched: 0
---

# PR Review — refonte/crisis-plan-phase2-safety-plan-view
Date : 2026-07-08

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreur, 193 warnings pré-existants `jsx-no-bind`) |
| test-web | `cd apps/web && npx vitest run` | ✅ (1075 tests, +2) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (966 tests, +7) |

## Synchronisation avec main
- Merge `origin/main` : propre (already up to date)
- Fichiers en conflit résolus : aucun

## Fichiers analysés
- Créés : 8 (SafetyPlanLayout web + mobile + tests, CrisisEmergencyCalls + test, styles/index, migration)
- Modifiés : 27 (dispatchers, ModuleContentScreen, AppStack, HomeScreen, EditableStepsLayout, service, shared index, PREVIEW_KINDS, seed, i18n ×6, docs ×5)

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 3 |
| ✅ Conformes | 35 fichiers |

---

## 🚫 VETO MDR
Aucun. La vue `safety_plan` est un **affichage brut** du plan du patient (étapes remplies,
numéros d'urgence, raisons de tenir) : aucun seuil, alerte conditionnelle, label clinique
ni interprétation. Les boutons d'appel sont des raccourcis `tel:` passifs.

## 🚫 Violations bloquantes
Aucune.

## ⚠️ Points d'attention

### `apps/mobile/.../layouts/shared/CrisisEmergencyCalls.tsx` — bouton d'appel natif
Le bouton d'appel est un `Pressable + Text` coloré à deux lignes (numéro + intitulé),
avec couleur dynamique par numéro. `ui/Button` ne couvre pas ce besoin (label mono-ligne).
Exception **documentée** en JSDoc conformément à coding-standards (« pas de variante
exacte → natif avec commentaire »), et le composant **centralise** un rendu jusqu'ici
dupliqué entre `EditableStepsLayout` et l'ancien `CrisisUrgencyLayout` (gain net).
→ Piste future : étendre `ui/Button` avec un slot sous-label + `style` inline pour la
couleur, si un 3ᵉ usage apparaît.

### `apps/mobile/.../layouts/SafetyPlan/SafetyPlanLayout.tsx` — lecture `lib/database` directe
`getAllPlanItemsForModule` est lu directement depuis `lib/database` (wrapper SQLite
générique, exception d'infrastructure autorisée). C'est **le pattern exact du frère**
`EditableStepsLayout` qui partage la même donnée `plan_items` ; aligner sur lui évite
d'introduire une architecture divergente. Lecture seule (aucune écriture ici → pas de
`syncUpsert` requis).

### `apps/mobile/.../ModuleContentScreen.tsx` — `previewKindOverride` non testé directement
Le mécanisme générique `previewKindOverride` (roue crantée → `editable_steps`) est
couvert **indirectement** : `SafetyPlanLayout.test` asserte l'appel `navigation.push(...,
{ previewKindOverride: 'editable_steps' })`. L'honneur du param dans `ModuleContentScreen`
lui-même n'a pas de test unitaire dédié.
→ Non bloquant (chemin simple, typé), mais un test du screen serait un plus.

## ✅ Points positifs
- **Design system respecté** : roue crantée = `@ui/Button` (variant `ghost`, `iconLeft`,
  `accessibilityLabel`) ; imports via `@ui`/`@theme`/`@services` (zéro relatif profond).
- **Généricité (config-first)** : `safety_plan` nommé par motif, libellés dérivés du
  `moduleId` sur les **deux** plateformes (`lbl = t(\`modules.${moduleId}.…\`)`) — jamais
  de clé de module en dur dans le layout.
- **DRY / altitude** : extraction de `CrisisEmergencyCalls` partagé, supprimant la
  triplication des boutons d'appel (SafetyPlan + EditableSteps + ancien urgence).
- **Suppression complète et cohérente** de la machinerie urgence (écran, layout, 2 widgets,
  service, route, `PREVIEW_KINDS`, seed, i18n) — aucun résidu `crisis_urgency`.
- **Parité web ≡ mobile** : aperçu web `SafetyPlanLayout` reflète la vue mobile (zones/ordre),
  réponses patient privées → placeholder (comme les photos d'ancrage).
- **Tests directs** pour chaque source créé (layouts web + mobile, composant partagé) —
  aucun composant mocké chez son seul consommateur.
- **Doc synchronisée** dans le même commit (module-engine, design-system, services, modules,
  database) + migration idempotente.
- **i18n** : parité fr/en + teen des nouvelles clés ; ponctuation sans tiret long.

---

## Checklist finale

### coding-standards.md
- [x] Zéro Supabase/SQLite brut (`db.execAsync`…) dans un composant (lecture via wrapper `lib/database`, comme le frère)
- [x] TypeScript strict (zéro any/as unknown/suppression) — `previewKindOverride` typé `PreviewKind`
- [x] Zéro allocation inline (callbacks `useCallback`, dérivations `useMemo`)
- [x] Architecture ui/ vs features/ respectée (layouts en `features/`, roue = `@ui/Button`)
- [x] Un seul composant par fichier
- [x] Primitives RN correctes (`Pressable`, `ScrollView` safe-area via ModuleContentScreen)
- [x] Design system — zéro valeur hardcodée (tokens web `var(--…)`, thème mobile)
- [x] i18n — zéro texte en dur + parité fr/en + teen
- [x] Schéma — pas de changement de schéma (migration data-only, source = seed.sql)

### config-first.md
- [x] Layout `safety_plan` générique, clés i18n dérivées du `module_id`
- [x] Zéro tableau TS décrivant du contenu de module

### sync-service.md (mobile)
- [x] `safety_plan` en lecture seule ; aucune écriture patient introduite

### CLAUDE.md
- [x] MDR 2017/745 — affichage brut, aucun seuil/alerte/interprétation
- [x] Composants réutilisés/étendus avant création (`@ui/Button`, `ExerciseSafetyField`, `StepsLayout`, `CrisisAnchorsWidget`)
- [x] Parité web ≡ mobile — aperçu web reflète la vue mobile (pas de chart concerné)

### Obligatoires pour toute feature (Étape 5)
- [x] Tests — chaque source créé a son test
- [x] Documentation créée/mise à jour et indexée
- [x] Zéro texte en dur (code + seed)
