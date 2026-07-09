---
date: 2026-07-09
branch: feat/crisis-plan-phase4-callable-contacts
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
warnings: 1
files_created: 6
files_modified: 20
rules_enriched: 0
---

# PR Review — feat/crisis-plan-phase4-callable-contacts
Date : 2026-07-09

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreur, warnings préexistants) |
| test-web | `cd apps/web && npx vitest run` | ✅ (1075 tests) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (998 tests, 129 suites) |

## Synchronisation avec main
- Merge `origin/main` : propre (Already up to date)
- Fichiers en conflit résolus : aucun

## Fichiers analysés
- Créés : 6 (permissionsService, contactsService + tests ; CallableContact, EditableContactsList + tests ; mock expo-contacts)
- Modifiés : 20 (services refactorés, layouts, database, seed, i18n ×8, docs ×3, app.json, mocks)

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 1 |
| ✅ Conformes | 25 fichiers sans remarque |

---

## 🚫 VETO MDR
Aucun. Tout reste passif : raccourci d'appel `tel:`, import d'un contact **choisi par le
patient**, aucun seuil, aucune alerte conditionnée aux données, aucune interprétation.

## 🚫 Violations bloquantes
Aucune.

## ⚠️ Points d'attention

### `apps/mobile/src/components/features/ModuleRenderer/layouts/shared/EditableContactsList.tsx`

**Callbacks inline vers `@ui/Button` (memoïsé) dans `contacts.map`** — chaque rangée passe
`onPress={() => handleSaveEdit(contact.id)}` / `onPress={() => onDelete(contact)}` en flèche
inline à un `Button` (React.memo). La memoïsation est donc rompue par rangée.
→ Impact négligeable (liste de contacts courte, 1 à 5 items par étape) et **cohérent avec le
sibling `EditableItemsList`** qui suit le même pattern. Une extraction en rangée memoïsée
dédiée serait la correction « propre » si la liste grandissait. Non bloquant.

## ✅ Points positifs

- **Extension > duplication (design system)** : `EditableContactsList` et `CallableContact`
  sont construits **exclusivement** avec `@ui/Button` + `@ui/InputField` — zéro `Pressable+Text+styles.xxxBtn`
  ad hoc. Le seul `Pressable` (rangée tap-to-edit) est une surface cliquable non bouton-shaped,
  usage légitime.
- **Unification des autorisations** : `permissionsService` centralise le couple get/request
  des 4 `PermissionKind` ; `notificationService`/`avatarService`/`crisisPlanService` **retirent**
  leur logique de permission dupliquée pour déléguer. Réduction nette de duplication.
- **Config-first** : le caractère « contactable » d'une étape est piloté par `field_props.contactable`
  (seed), jamais par un numéro d'étape en dur dans le code — les deux layouts lisent la prop.
- **Minimalisme Apple** : sur iOS le picker de contacts natif est présenté **sans** demander de
  permission (recommandation Apple) ; Android seul passe par `READ_CONTACTS`. Chaînes `Info.plist`
  spécifiques et honnêtes déclarées via les config plugins Expo.
- **Sync** : `savePlanItem` étend son payload (`phone`/`contact_source`) en restant sur `syncUpsert`.
- **Couverture directe** : chaque source créé a son test (permissionsService, contactsService,
  CallableContact, EditableContactsList) + tests d'intégration du branchement contactable dans
  `SafetyPlanLayout` et `FieldRenderer.editable_steps` (le sous-composant n'est pas mocké chez son
  consommateur).
- **i18n** : 5 clés × (common fr/en + teen fr/en + best-effort de/es/it/pt), zéro tiret long,
  variantes teen présentes (habillage applicatif, registre neutre).
- **Doc** : `docs/services.md` (permissionsService, contactsService), `docs/module-engine.md`
  (`contactable` + rendu contact), `apps/mobile/docs/design-system.md` (2 composants shared),
  `docs/modules.md`, mises à jour dans le même commit.

## Checklist finale
- [x] Zéro Supabase/SQLite dans les composants (services wrappent le natif à la frontière infra)
- [x] TypeScript strict (zéro any / as unknown / suppression)
- [x] Design system d'abord (@ui/Button + @ui/InputField, zéro contrôle ad hoc)
- [x] i18n zéro texte en dur + parité fr/en + teen
- [x] Config-first (`field_props.contactable`, pas de numéro d'étape en dur)
- [x] Sync via syncUpsert (payload étendu)
- [x] MDR — aucun seuil/alerte/interprétation
- [x] Parité web ≡ mobile — Phase 4 sans graphique ; numéros = données patient privées (comme les photos), aperçu web = structure + note privée
- [x] Tests directs pour chaque source + intégration
- [x] Doc créée/mise à jour et indexée
- [x] Seed idempotent (`on conflict do nothing`), aucune nouvelle table (pas de RLS/schema.sql requis)

📚 lessons.md déjà à jour — aucune violation bloquante, aucun cas à ajouter.
