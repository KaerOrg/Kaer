---
date: 2026-06-16
branch: integration/observance-vers-main
pr_number: 55
pr_url: https://github.com/KaerOrg/Kaer/pull/55
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
warnings: 5
files_created: 30
files_modified: 25
rules_enriched: 0
---

# PR Review — integration/observance-vers-main (PR #55 — module `medication_adherence`)
Date : 2026-06-16

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreur, 1 warning auto-fixable préexistant) |
| test-web | `cd apps/web && npx vitest run` | ✅ |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (103 suites, 799 tests) |

## Synchronisation avec main
- Merge `origin/main` : **propre** (auto-merge `ort`, aucun conflit). La refonte agenda-sommeil de `main` a été intégrée sans heurt.
- Fichiers en conflit résolus : aucun.
- Périmètre réel de la PR isolé via `git diff origin/main...HEAD` (le `main` local étant en retard, `main...HEAD` mélangeait la refonte sommeil déjà mergée).

## Fichiers analysés (contribution propre de la branche)
- Créés : ~30 fichiers (layout mobile `MedicationTracker/`, layout web `MedicationTrackerLayout/`, services `medicationIntakeService`/`medicationListService`, hook `useMedicationListEditor`, `MedicationAddForm`, `MedicationAdherenceCard`)
- Modifiés : ~25 fichiers (seed, i18n ×6, `database.ts`, `syncOutbox.ts`, `shared/index.ts`, dispatchers, docs ×5, `MonthCalendar`)

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 5 |
| ✅ Conformes | l'essentiel des fichiers |

PR de très bonne facture : conformité MDR exemplaire, parité web↔mobile, couches respectées, sync correcte, i18n complète (teen incluse), docs à jour. Aucune violation bloquante.

---

## 🚫 VETO MDR
Aucun. Conformité **exemplaire** :
- Statuts : `pris` = vert, `partiel` = ambre, **`non pris` = gris neutre `#6B7280` (jamais rouge)** — aucune gravité clinique encodée.
- Série « jours renseignés » (`computeLoggedStreak`) : compte les jours civils où le carnet est rempli **quel que soit le statut** — valorise l'acte de suivi, jamais la prise. Un oubli renseigné ne casse pas la série.
- Calendrier passif, aucun taux d'observance, aucune tendance, aucune flèche.
- Le seul `it('alerte sans enregistrer si aucun statut sélectionné')` est une **validation de formulaire** (toast info « choisis un statut »), pas une alerte conditionnée aux données.
- Commentaires de conformité MDR présents dans chaque fichier sensible.

---

## 🚫 Violations bloquantes
Aucune.

---

## ⚠️ Points d'attention

### `apps/mobile/.../MedicationTracker/MedicationEditorModal.tsx` (l. 73-94) — [Design system]
Le sélecteur fond/PRN (`kindBtn`) est un choix exclusif à 2 options **hand-rollé** (`Pressable` + `styles.kindBtn`/`kindBtnSelected`). Le pendant **web** (`MedicationAddForm`) utilise correctement `ui/SegmentedControl`. Côté mobile, `ui/PillSelector` (sélecteur à pilules, une option active) couvre ce besoin.
→ Envisager `PillSelector` (options `['maintenance','prn']`) pour aligner mobile↔web et supprimer ~10 styles ad hoc. Non bloquant : le visuel diffère légèrement (bordure + fond clair vs remplissage plein) et `PillSelector` reste à confirmer sur le rendu `flex:1`.

### `apps/web/.../MedicationTrackerLayout/previewExamples.ts` — [Tests]
`buildCalendarStatusByDay` (logique déterministe modulo) et `buildExampleMeds` sont des helpers purs **sans test direct** — couverts seulement indirectement par `MedicationTrackerLayout.test.tsx`. C'est exactement le cas `sleepHelpers` consigné dans `lessons.md` (refonte/agenda-sommeil, 2026-06-15) : un helper pur à logique mérite son test unitaire, même si « ça passe » via un test plus haut. Faible enjeu (données d'illustration d'aperçu).

### `apps/web/.../PatientPage/tabs/MedicationAdherenceCard.tsx` — [Tests]
Composant à callbacks (`handleToggle`/`handleNotif`/togglers) **sans `.test.tsx` dédié** — couvert indirectement via `PatientModulesTab`. Un test de rendu + interaction propre serait préférable.

### `apps/web/.../MedicationTrackerLayout/PreviewTodayPanel.tsx` (l. 18) — [Render]
`const meds = buildExampleMeds(moduleId, t, lbl)` est recalculé à chaque rendu (allocation d'un tableau d'objets). Mémoïser (`useMemo` sur `[moduleId, t, lbl]`). Faible enjeu (panneau d'aperçu).

### Parité graphique web↔mobile — [Étape 4]
Le `CalendarTab` mobile affiche un `MonthCalendar` passif (pastille neutre par jour renseigné). Côté **données réelles** web, `medication_adherence` retombe sur `ModuleSummaryPanel` (tableau résumé via `fetchModuleSummary` : dernière date + nombre + dernier payload) — il n'y a **pas** de vue calendrier/heatmap des vraies données. Conforme à la règle « MonthCalendar mobile → web sans heatmap = point d'attention » : la donnée patient **est** visible (résumé), seule la forme calendrier manque. L'aperçu (`PreviewCalendarPanel`) reproduit bien le calendrier, mais sur données illustratives. À considérer si une vraie heatmap praticien est souhaitée plus tard.

---

## ✅ Points positifs
- **MDR exemplaire** (cf. section VETO) : choix du gris neutre pour « non pris », streak basée sur le suivi et non la prise — la règle d'or est intégrée au design même de la feature.
- **Config-first respecté** : statuts, motifs, libellés des 3 onglets, couleurs des pastilles, icônes, et pont inter-modules (`links_module`) entièrement en base (`module_content_fields` + `field_props`), `text_code` = clés i18n. Ajouter un statut/motif = INSERT, zéro redéploiement.
- **Sync mobile conforme** : `medicationIntakeService` passe par `syncUpsert`/`syncDelete`, `entry_kind: 'medication_intake'` ajouté à l'union `EntryKind` (zéro cast), table SQLite `medication_intakes` idempotente (`ON CONFLICT ... DO UPDATE`). `medicationListService` (config en ligne `patient_modules.config`) justifie en JSDoc pourquoi il ne passe pas par sync.
- **Couches propres** : `medList` (état + fetch/mutation) possédé par `PatientModulesTab` (l. 111) et injecté à `MedicationAdherenceCard` par props — aucune feuille ne pilote son cycle de données.
- **Design system bien utilisé** : web réutilise `Tabs` (variant `compact`), `Card`, `Chip` (`size="sm"`, `tone="neutral"`), `Button`, `SegmentedControl` ; mobile réutilise `Button` (`iconLeft`), `ConfirmDialog`, et **étend `MonthCalendar`** (mode `dayMarkers` + légende explicite) — extension documentée dans `design-system.md`. ✅
- **`preview_kind` bien nommé** par motif (`medication_tracker`) et `moduleId` dérivé des `fields` des deux côtés (web `fields[0]?.module_id`, mobile idem) — généricité préservée.
- **i18n parité parfaite** : 41/41 clés mobile en `fr`/`en` × `common`/`teen` ; 48/48 web `fr`/`en`. Mode ado couvert.
- **Documentation à jour dans le même commit** : `module-engine.md` (3 field_types + layout), `services.md` (les 2 services mobiles + ajout web), `modules.md`, `docs/modules/medication_adherence.md`, `design-system.md` (MonthCalendar).
- **Tests d'intégration solides** : `MedicationTrackerLayout.test.tsx` rend les vrais sous-composants et couvre statut/motif/pont/save/détail-molécule/navigation-date/streak ; `streakUtils`, `useMedicationListEditor`, `MedicationAddForm`, `MedicationEditorModal` testés directement.

---

## Checklist finale
### coding-standards.md
- [x] Zéro Supabase/SQLite dans les composants
- [x] Feuilles présentationnelles — `medList` possédé par la page, injecté par props
- [x] TypeScript strict (zéro any/as unknown/suppression) — `Medication` en `readonly`
- [x] Architecture ui/ vs features/ respectée
- [x] Un seul composant par fichier
- [x] Design system — tokens (fontSize littéral = convention codebase confirmée)
- [x] i18n — zéro texte en dur, parité fr/en + teen, seed = clés
### config-first.md
- [x] Zéro tableau TS décrivant le contenu — tout en seed
### sync-service.md
- [x] `syncUpsert`/`syncDelete`, `EntryKind` étendu, mocks présents
### CLAUDE.md
- [x] MDR — aucun seuil/alerte/interprétation (exemplaire)
- [x] Mode Ado — `useTeen` + `useTranslation(['teen','common'])`
- [x] Parité graphique — donnée réelle visible via résumé (heatmap = point d'attention)
- [x] Services — JSDoc + tests + docs/services.md
### Tests & doc (Étape 5)
- [x] Doc créée/mise à jour et indexée
- [~] Tests : helpers d'aperçu purs + `MedicationAdherenceCard` sans test direct (points d'attention)
