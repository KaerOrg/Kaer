---
date: 2026-06-12
branch: feat/improve-module-organization
pr_number: 46
pr_url: https://github.com/KaerOrg/Kaer/pull/46
ci_pass: true
merge_clean: true
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 0
  tests: 2
  docs: 1
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
warnings: 7
files_created: 10
files_modified: 13
rules_enriched: 1
---

# PR Review — feat/improve-module-organization (PR #46)
Date : 2026-06-12

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreur, 185 warnings `jsx-no-bind` préexistants) |
| test-web | `cd apps/web && npx vitest run` | ✅ (641 passed) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (749 passed) |

## Synchronisation avec main
- Merge `origin/main` : **propre** (auto-merge — apporte la refonte distress_tolerance + déploiement web)
- Fichiers en conflit résolus : aucun

## Fichiers analysés
- Créés : 10 (ModuleFilterBar ×4, ModuleTagChips ×3, moduleFilter.ts + test, docs/spec/module-taxonomy.md)
- Modifiés : 13 (Chip ×3, i18n fr/en, database.types.ts, ModuleCatalogPage, PatientModulesTab, MedicationSideEffectsCard, PatientPage.css, moduleCatalogService, schema.sql, seed.sql)

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 3 |
| ⚠️ Points d'attention | 7 |
| ✅ Conformes | 13 fichiers sans remarque |

## 🚫 VETO MDR
**Aucun.** Au contraire : la spec (§4, §9bis) traite la conformité MDR par construction — les tags sont une métadonnée de catalogue praticien, aucune table ne relie un tag à une donnée patient, et le **non-portage mobile est explicitement justifié par le veto MDR** (étiqueter le patient avec « Crise suicidaire » sur son propre module serait un label interprétatif). Analyse exemplaire.

---

## 🚫 Violations bloquantes

### `apps/web/src/components/features/ModuleFilterBar/` + `ModuleTagChips/`

**[Tests manquants — Étape 5.1]**
Aucun fichier `.test.tsx` pour `ModuleFilterBar.tsx`, `ModuleFilterChip.tsx` ni `ModuleTagChips.tsx`. `ModuleFilterBar` a des callbacks (`onToggleTag`, `onReset`), un rendu conditionnel (dimensions vides, footer reset) ; `ModuleTagChips` a un early-return et un mapping tone. La logique pure est bien couverte par `moduleFilter.test.ts`, mais les composants eux-mêmes (rendu par défaut + interaction) ne le sont pas.
→ Ajouter `ModuleFilterBar.test.tsx` (rendu des dimensions, clic sur une puce → `onToggleTag(dim, tag)`, bouton reset visible seulement si filtre actif) et `ModuleTagChips.test.tsx` (rendu des lignes, `null` sans tags).

### `apps/web/src/services/moduleCatalogService.ts`

**Lignes 62–82 — [Service : test obligatoire]**
`fetchModuleTaxonomy()` ajoutée sans couverture : `moduleCatalogService.test.ts` existe mais n'a pas été modifié et ne mentionne pas la taxonomie.
→ Ajouter happy path (groupement `tagsByDimension` / `tagsByModule`) + cas d'erreur (`data: null` → structures vides), sur le modèle des tests voisins.

### `apps/web/docs/design-system.md`

**[Documentation — §5.2.1]**
Deux nouveaux composants `features/` (`ModuleFilterBar`, `ModuleTagChips`) sans section de doc (chemin + usage + table des props) — ils n'apparaissent nulle part dans la doc. Et la section `### Chip` existante n'a pas été mise à jour avec la nouvelle prop `size: 'sm' | 'md'`.
→ Ajouter les deux sections + la ligne `size` dans la table des props de `Chip`, dans le même commit.

---

## ⚠️ Points d'attention

### `ModuleCatalogPage.tsx` + `PatientModulesTab.tsx`

**[Réutilisation]** `EMPTY_TAXONOMY`, `toggleTag` et `resetFilters` sont dupliqués **verbatim** dans les deux fichiers. La spec §8 prévoyait d'ailleurs un hook. → Extraire un hook `useTagFilters()` (état + toggle + reset, voire le fetch de taxonomie) ; règle « tout utilisé dans ≥2 contextes est extrait ».

**`ModuleCatalogPage.tsx:20-21` — [Style]** `const EMPTY_TAXONOMY` déclarée *entre* les imports (avant `import './ModuleCatalogPage.css'`). Déplacer après le bloc d'imports.

**`PatientModulesTab.tsx:782` — [Render]** `onClose={() => { setShowAddModal(false); setSearchQuery('') }}` — callback inline non mémoïsé passé à `Modal` (pattern préexistant dans le fichier, mais le code nouveau aurait pu faire un `useCallback`).

### `apps/web/src/lib/moduleFilter.ts:59`

**[Config-first — borderline]** `CARD_DIMENSIONS = ['indication', 'population']` fige en code quelles dimensions s'affichent sur les cartes. Choix présentationnel défendable (comme les maps d'icônes), mais si l'équipe veut un jour montrer l'approche sur les cartes sans redéploiement → colonne `show_on_card` sur `tag_dimensions`.

### `docs/README.md`

**[Indexation]** `docs/spec/module-taxonomy.md` n'est pas référencée dans l'index alors que toutes les autres specs (`calendar`, `file-active`, `admin-users`…) le sont.

### `docs/spec/module-taxonomy.md:3`

**[Doc périmée]** Statut « à implémenter » alors que c'est implémenté ; §8 nomme `fetchModuleTags()` / `useModuleFilter` alors que l'implémentation réelle est `fetchModuleTaxonomy()` / fonctions pures `lib/moduleFilter.ts`. Mettre à jour.

### `docs/services.md:50`

**[Doc]** L'entrée `moduleCatalogService` ne mentionne pas la taxonomie — compléter la description.

---

## ✅ Points positifs

- **Extension > duplication, appliquée** : `Chip` étendu avec la prop `size` (type + CSS + usage) au lieu d'un composant parallèle — exactement le comportement attendu.
- **Config-first exemplaire** : taxonomie 100 % en base (3 tables), libellés via clés i18n (`tags.<id>.label`), zéro texte en base, ajout d'un tag = un INSERT.
- **MDR par construction** : modèle de données qui rend l'interprétation impossible, non-portage mobile argumenté (spec §9bis).
- **Sécurité/Schéma** : RLS lecture-seule `authenticated` sur les 3 tables, écritures réservées au service role, seed idempotent (`ON CONFLICT`), `schema.sql` et `database.types.ts` à jour, index FK posés, tous les `module_id` tagués existent dans le seed `modules`.
- **`moduleFilter.ts`** : fonctions pures, types `Readonly*`, testées exhaustivement (OU intra-dimension / ET inter-dimensions, immutabilité, cas vides).
- **Couches respectées** : `ModuleFilterBar` strictement présentationnel — état possédé par la page, injecté par props ; `ModuleFilterChip` mémoïsé + `useCallback` (zéro handler recréé par puce).
- **UX réfléchie** : seuil `ACTIVE_FILTER_THRESHOLD = 8` commenté (« pas de filtrage masqué sans contrôle visible »), `empty_filter` distinct d'`empty_search`.
- **Parité i18n fr/en** complète sur les 30 nouvelles clés (web uniquement — pas de teen requis, justifié).

---

## Checklist finale

- [x] Rules of Hooks / cleanup effects / keys stables / pas d'async direct dans useEffect
- [x] Zéro Supabase/SQLite dans les composants (tout passe par `moduleCatalogService`)
- [x] Feuilles présentationnelles — données + callbacks par props (ModuleFilterBar/Chips)
- [x] TypeScript strict — zéro `any` / `as unknown` / suppression
- [x] Zéro allocation inline dans le nouveau code (sauf 1 onClose Modal — signalé)
- [x] Architecture `features/` correcte, un composant par fichier, `index.ts` de ré-export
- [x] Design system — tokens CSS avec fallbacks dans les 2 nouveaux CSS
- [x] i18n — zéro texte en dur, code ET base ; parité fr/en
- [x] RLS — tables de référence read-only ; `schema.sql` à jour
- [x] Config-first — vocabulaire en base, zéro tableau TS de contenu
- [x] MDR 2017/745 — conforme, veto mobile documenté
- [x] Parité web ≡ mobile — non applicable (feature praticien, justifié spec §9bis)
- [ ] **Tests** — composants ModuleFilterBar/ModuleTagChips + `fetchModuleTaxonomy` non couverts 🚫
- [ ] **Documentation** — sections design-system manquantes + prop `size` de Chip non documentée 🚫 ; spec non indexée ⚠️
