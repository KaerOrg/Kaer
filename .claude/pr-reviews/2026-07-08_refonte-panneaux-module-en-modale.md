---
date: 2026-07-08
branch: refonte/panneaux-module-en-modale
pr_number: 129
pr_url: https://github.com/KaerOrg/Kaer/pull/129
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
files_created: 19
files_modified: 21
rules_enriched: 0
---

# PR Review — refonte/panneaux-module-en-modale
Date : 2026-07-08

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreurs, 186 warnings pré-existants `react/jsx-no-bind`) |
| test-web | `cd apps/web && npx vitest run` | ✅ 1078 passed |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 960 passed |

## Synchronisation avec main
- Merge `origin/main` : **propre** (déjà à jour — le merge de resynchronisation avait été fait en amont via stratégie `ours`, justifiée : le squash-merge de #128 est byte-identique au commit `70753f1` de la branche).
- Fichiers en conflit résolus : aucun.

## Fichiers analysés
- Créés : 19 fichiers (dont 8 sources + 8 tests + 1 CSS + 1 doc + i18n)
- Modifiés : 21 fichiers
- Renommés : 3 (`NotificationRoutineModal/` → `NotificationRoutinePanel/`)

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 5 |
| ✅ Conformes | scope sans violation bloquante |

Refonte propre et bien exécutée : consolidation de toutes les actions d'une carte module dans une modale unique à onglets, extraction de 5 éditeurs de config en panneaux réutilisant le design system existant, couverture de tests systématique, MDR-safe. Les 5 points d'attention concernent **des patterns pré-existants relocalisés** depuis le code déjà mergé en #128 — aucun n'est une régression introduite par cette PR.

---

## 🚫 VETO MDR
Aucun. Zéro seuil, zéro label clinique interprétatif, zéro alerte conditionnée aux données. Les notifications restent des rappels horaires fixes non conditionnels. ✅

---

## 🚫 Violations bloquantes
Aucune.

---

## ⚠️ Points d'attention

### `pages/PatientPage/tabs/PatientModulesTab.tsx`

**Lignes ~793 / ~739 — [React perf — mémoïsation inefficace]**
`configPanel = useMemo(…, [activeModule, crisis, rim, psycho, medEffects, medList, baList, …])` et `handlePsychoConfirm = useCallback(…, [psycho, closeModal])` dépendent d'objets retournés par des hooks, **recréés à chaque render** → le `useMemo`/`useCallback` ne mémoïse jamais.
→ Sans conséquence fonctionnelle (le nœud n'est rendu que sur l'onglet `config`, coût négligeable), mais la mémoïsation est de façade. Option : dépendre de valeurs primitives stables (`activeModule?.module`, `activeModule?.tab`) ou assumer le recalcul en retirant le `useMemo`.

### `pages/PatientPage/tabs/MedicationEffectsConfigPanel.tsx`

**Ligne ~64 — [Design system — `<input>` natif]**
Champ d'ajout d'effet personnalisé rendu en `<input className="med-effects-config__add-input">` natif alors que `@ui/InputField` / `@ui/SearchInput` existent.
→ **Pattern relocalisé verbatim** depuis `MedicationSideEffectsCard` (déjà mergé en #128), non introduit par cette PR. À aligner sur `@ui/InputField` (champ non contrôlé via `ref`) dans une passe de nettoyage ultérieure.

### `pages/PatientPage/tabs/MedicationListConfigPanel.tsx` + `BAActivitiesConfigPanel.tsx`

**Boutons de suppression de ligne — [Design system — `<button>` natif]**
`<button className="med-row__remove"><Trash2 /></button>` natif pour supprimer une ligne.
→ **Relocalisé verbatim** des cartes médication/BA de #128. Icône d'action dans une ligne de liste (cas limite « surface non bouton-shaped »), mais à considérer pour `@ui/Button` variante icône. Non bloquant, relocalisé.

### `pages/PatientPage/tabs/RimConfigPanel.tsx` (et `CrisisPlanConfigPanel.tsx`)

**onChange inline — [Render — callback inline]**
`onChange={e => rim.setAlternative(e.target.value)}` inline sur `InputField` (warnings `react/jsx-no-bind` 43/51).
→ Pattern **omniprésent dans le codebase** (ProfilePage, PatientRegisterPage, les éditeurs inline d'origine). Cohérent avec l'existant, warning-level. Non bloquant.

### `components/features/NotificationRoutinePanel/NotificationRoutinePanel.tsx`

**Sous-composant privé `RoutineRow` — [Un fichier = un composant]**
`RoutineRow` déclaré dans le même fichier que `NotificationRoutinePanel`.
→ **Relocalisé verbatim** depuis l'ancien `NotificationRoutineModal.tsx`. Un seul composant *exporté* (règle respectée à la lettre), mais l'idéal « un fichier = un composant » suggère d'extraire `RoutineRow` dans un fichier voisin. Relocalisé, non introduit.

---

## ✅ Points positifs

- **Design system — extension/réutilisation exemplaire.** Les 5 panneaux de config réutilisent `@ui/Button`, `@ui/InputField`, `@ui/Chip`, `@ui/Tooltip` et les classes existantes (`crisis-card`, `module-editor-fields`, `med-list`, `psycho-card-picker`) au lieu de dupliquer. `ModuleActionsModal` s'appuie sur `@ui/Modal` + `@ui/Tabs`.
- **Retrait d'un bypass du design system :** `BehavioralActivationCard` migrée de boutons `<button>` natifs (`module-card__notif-btn`, `preview-toggle-btn`) vers `ModuleCardFooter` — dette supprimée, alignement sur les autres cartes (§4.4 : à saluer).
- **Retrait de prop morte :** `modItem` supprimé des 4 cartes (n'était plus utilisé).
- **Découplage propre :** les panneaux de config sont présentationnels — ils reçoivent le hook d'édition (données + callbacks) du parent `PatientModulesTab` qui possède l'orchestration. Aucune feuille ne fetch/mute pour son compte (`NotificationRoutinePanel` self-fetch via React Query, aligné sur `ModuleDataPanel`/`ModulePreviewPanel`).
- **Pattern de fermeture robuste :** `rim.confirm` / `psycho.confirm` / `crisis.saveEditor` retournent un booléen de succès → la modale ne se ferme qu'au succès (échec de validation → éditeur maintenu). Couplage déverrouillage rim/psycho correctement géré.
- **Couverture de tests complète :** chaque source créé a son test (`ModuleActionsModal`, `computeModuleTabs`, `ModulePatientViewPanel`, les 5 panneaux, cartes). Helper pur `computeModuleTabs` testé exhaustivement (verrouillé/déverrouillé, échelle, familles).
- **Documentation :** `apps/web/docs/module-actions-modal.md` créé **et indexé** (README web + design-system.md) ; refs mises à jour dans 5 docs (notification-routines, mood_tracker, chronobiology_tracker, rythmes-regularite).
- **i18n :** nouvelle clé `patient.config_tab` ajoutée en `fr` **et** `en` ; aucun texte visible en dur (tout via `t()`). Web sans `teen.json` → pas de parité teen requise.
- **MDR-safe**, **zéro Supabase/db dans les composants**, **zéro `as any`/`as unknown`/suppression**.

---

## Checklist finale

### Bonnes pratiques React / Vercel
- [x] Rules of Hooks respectées
- [x] `useEffect` avec cleanup (ModulePatientViewPanel : effet de reset sans abonnement, ok)
- [x] Clés stables dans les `.map()` (`key={med.id}`, `key={activity.id}`, `key={card.id}`…)
- [x] Zéro `async` callback direct dans `useEffect`
- [x] Pas de `React.lazy` sans `Suspense`

### coding-standards.md
- [x] Zéro Supabase/SQLite dans les composants
- [x] Feuilles présentationnelles (hook injecté par le parent) — aucune fuite d'orchestration
- [x] TypeScript strict (zéro any/as any/as unknown/suppression)
- [~] Zéro allocation inline — onChange inline sur InputField (warning pré-existant, cf. PA)
- [x] useState vs useRef correct (`customRef`, `timeRef`, `noteRef` en ref)
- [x] Architecture ui/ vs features/ respectée
- [~] Un seul composant par fichier — `RoutineRow` privé relocalisé (cf. PA)
- [x] Design system web — zéro valeur hardcodée (CSS via tokens)
- [x] i18n — zéro texte en dur + parité fr/en (web, pas de teen)
- [x] Sécurité / Schéma — pas de SQL dans cette PR
- [x] Imports `@ui`/`@services` — relatifs simples cohérents avec le dossier

### config-first.md
- [x] Pas de contenu éditorial de module en TS statique. Les sets de `moduleActionTabs.ts` (PREVIEW_REQUIRES_UNLOCK, CONFIG_UNLOCK_GESTURE…) classent le **comportement d'interaction** des modules (dispatch, change à la vitesse du code), pas du contenu — analogue à `chartKind()`/`FIELDLESS_LAYOUTS` existants. Conforme.

### CLAUDE.md
- [x] MDR 2017/745 — aucun seuil/alerte/interprétation
- [x] Composants existants réutilisés/étendus avant création
- [x] Parité web ≡ mobile — PR sans changement de module/graphique ni de mobile
- [x] Tests + doc livrés pour toute surface nouvelle

### Obligatoires et bloquants (Étape 5)
- [x] Tests — chaque source créé a son test
- [x] Documentation — `.md` créé/mis à jour **et indexé**
- [x] Composants documentés (feature doc `module-actions-modal.md` + inventaire design-system)
- [x] Zéro texte en dur (code)
