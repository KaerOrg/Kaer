---
date: 2026-06-22
branch: refonte/psychotropes-et-alimentation
pr_number: 64
pr_url: https://github.com/KaerOrg/Kaer/pull/64
ci_pass: true
merge_clean: false
violations:
  mdr: 0
  data_access: 0
  typescript: 1
  i18n: 1
  tests: 0
  docs: 0
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
warnings: 6
files_created: 48
files_modified: 45
rules_enriched: 1
---

# PR Review — refonte/psychotropes-et-alimentation
Date : 2026-06-22

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreur, 198 warnings préexistants `jsx-no-bind`) |
| test-web | `cd apps/web && npx vitest run` | ✅ (801 passés) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (810 passés / 104 suites) |

## Synchronisation avec main
- Merge `origin/main` : **conflits résolus**
- Fichiers en conflit résolus : `docs/modules.md` (retrait `diet_weight_psycho` conservé côté HEAD, ligne `chronobiology_tracker` alignée sur `origin/main` avec le lien doc ; label réel confirmé « Rythmes & régularité » via i18n).

## Fichiers analysés
- Créés : ~48 fichiers
- Modifiés : ~45 fichiers

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 2 |
| ⚠️ Points d'attention | 6 |
| ✅ Conformes | majorité |

---

## 🚫 VETO MDR
Aucun. Le module respecte strictement la règle d'or : la série « jours renseignés »
compte l'**acte de suivi** (un oubli renseigné ne casse pas la série), jamais
l'observance ; les pastilles de statut sont neutres et fournies par la base (couleurs
décoratives, zéro gravité clinique) ; aucun taux d'observance, aucune alerte
conditionnelle, aucune tendance. L'efficacité du sommeil est affichée en valeur brute.
Le codage visuel des métriques sommeil côté **praticien** (SleepDataPanel) est commenté
et assumé comme analyse soignant. Conforme.

---

## 🚫 Violations bloquantes

### Ponctuation — tiret long U+2014 dans des textes visibles i18n

**[i18n / Ponctuation]** La clé `modules.medication_adherence.calendar_legend` est
écrite avec un cadratin `—` dans **6 valeurs visibles** :

- `apps/mobile/src/i18n/locales/fr/common.json:465` — « Jour renseigné — couleur du statut déclaré »
- `apps/mobile/src/i18n/locales/en/common.json:415` — « Logged day — colour of the declared status »
- `apps/mobile/src/i18n/locales/fr/teen.json:406` — « Jour rempli — couleur du statut que tu as choisi »
- `apps/mobile/src/i18n/locales/en/teen.json:405` — « Filled day — colour of the status you picked »
- `apps/web/src/i18n/locales/fr/common.json:600`
- `apps/web/src/i18n/locales/en/common.json:851`

→ Remplacer le `—` par un **deux-points** (introduction d'une explication) :
« Jour renseigné : couleur du statut déclaré ». Vérif : `grep -rlP "\x{2014}|\x{2013}" apps/*/src/i18n/locales` doit être vide.

### TypeScript — `as unknown as` (double-cast)

**`apps/web/src/pages/PatientPage/hooks/useMedicationListEditor.test.ts:17`**
```ts
const modules = [{ id: 'pm1', module_type: 'medication_adherence' } as unknown as PatientModule]
```
→ Interdit par la règle « zéro `as unknown` », sans exception « c'est un test ».
Construire le mock via une factory typée (ou `satisfies`). Risque réel faible (mock
partiel) et recopie un pattern d'un test frère (`useMedicationEffectsEditor.test.ts`,
hors périmètre) — mais le motif ne doit pas se propager. À corriger.

---

## ⚠️ Points d'attention

### `apps/mobile/.../MedicationTracker/MedicationTrackerLayout.tsx`
- **L242 / L255** — `TABS` reconstruit dans le render et `onPress={() => setTab(item.id)}` inline dans le `.map`. Mémoïser le tableau (`useMemo`) et stabiliser le handler (les items sont des `Pressable` non mémoïsés, mais la règle « zéro allocation inline » s'applique).
- Onglets faits main (`Pressable` + `styles.tab/tabActive`) — **acceptable** : il n'existe pas de primitive `ui/Tabs` côté mobile (le web l'a). Pattern conforme aux autres layouts tabbed mobiles.

### `apps/mobile/.../MedicationTracker/TodayTab.tsx`
- **L101 / L126 / L181** — callbacks inline dans les `.map` (`onSelectStatus`, `onSelectReason`, `onSetMoleculeStatus`). Cohérent avec le code voisin mais contraire à « zéro allocation inline ».
- Pastilles de statut (icône + label + couleur par option) répétées en version pleine et compacte. Le primitive `Radio` (variant `pills`) ne couvre pas l'icône + couleur par option : extension de `Radio` envisageable, ou composant feuille dédié. Non bloquant en l'état.

### `apps/mobile/.../SleepJournal/SleepEntryView.tsx`
- **L139-140** — `qualityLabels` / `restednessLabels` reconstruits à chaque render (dépendent de `lbl`) → candidats `useMemo`.
- **L210 / L253 / L267** — handlers inline (compteur réveils, toggles aide/cauchemars).
- Toggles « interrupteur » faits main (`switchTrack`/`switchThumb`) dupliqués deux fois dans le fichier — **acceptable** (pas de primitive `Toggle` mobile) mais extractibles en une feuille commune.

### `apps/web/.../MedicationAdherenceCard.tsx`
- **L147** — `onClick={() => medList.removeMedication(med.id)}` inline dans le `.map`.
- `<button>` natifs (notif, preview/data toggles, suppression) — **légitimes** : ils reprennent le pattern partagé des cartes module (`preview-toggle-btn`, `module-card__notif-btn`) déjà en place ; surfaces icône/toggle non « bouton-shaped » du design system.

### `apps/web/.../SleepDataPanel.tsx`
- **L140 / L148** — couleurs de série en hex (`#06B6D4`, `#6366F1`) passées en prop au chart. Cohérent avec le pattern existant de `PatientEvolutionTab`. Idéalement des tokens, mais hors périmètre de cette refonte.

### i18n — dette préexistante (non introduite ici)
- `WEEKDAYS_SHORT = ['L','M','M','J','V','S','D']` (sleepHelpers.ts) et `AXIS_TICKS` (`12h`/`18h`…) sont du texte non i18n, **mais** c'est le pattern déjà en place (`ActivityLogLayout`). À traiter globalement, pas dans cette PR.

---

## ✅ Points positifs

- **Nouveaux primitives `ui/`** (`Radio`, `RatingSelector`, `TimePickerField`) : purs, mémoïsés, props-driven, zéro métier, tokens du thème — **documentés** (sections dédiées + props + usage dans `design-system.md`) et **testés**. Remplacent proprement `PillSelector`/`PipPicker` supprimés (zéro référence orpheline).
- **Sync** : `medicationIntakeService` utilise `syncUpsert`/`syncDelete` ; `medication_intake` ajouté à l'union `EntryKind` (zéro cast). `medicationListService` écrit dans `patient_modules.config` (exception légitime documentée en JSDoc, pas de SQLite patient).
- **Config-first** : `moduleId` dérivé des `fields` (web + mobile), statuts/motifs/libellés chargés depuis `module_content_fields`/`field_props`, zéro tableau TS statique.
- **Découpage / couches** : onglets et panneaux (TodayTab/CalendarTab/MedicationsTab, Preview*Panel) présentationnels ; orchestration dans le layout conteneur et le hook `useMedicationListEditor`. `MedicationAdherenceCard` extraite pour héberger des `useCallback` stables.
- **`saveMedicationIntake`** : `ON CONFLICT(module_id, date, medication_id) DO UPDATE` — idempotent.
- **Parité web ≡ mobile** : aperçu `MedicationTrackerLayout` (3 onglets dont calendrier) + `ModuleDataPanel` côté praticien ; agenda sommeil reflété par `SleepDataPanel` (grille 24h + courbes efficacité/durée), données synchronisées via `engagementService`.
- **i18n** : parité parfaite — 41 clés `medication_adherence` dans fr/en common ET teen.
- **Documentation** : `module-engine.md` (preview_kind `medication_tracker` + field_types `medication_tracker_config`/`daily_status_option`/`medication_reason_option` + `sleep_journal_config`), `design-system.md`, `services.md`, `docs/modules/*` tous à jour.
- **Tests** : chaque source créé a son test (services, hooks, helpers purs `streakUtils`/`sleepHelpers`/`sleepGrid`, composants).

---

## Checklist finale
- [x] CI verte (5 jobs)
- [x] Zéro Supabase/SQLite direct dans un composant (reads `lib/database` = convention mobile établie)
- [x] Feuilles présentationnelles, orchestration en haut
- [ ] TypeScript strict — 1 `as unknown as` (test) à corriger
- [x] Architecture ui/ vs features/ respectée ; un composant par fichier
- [x] Design system réutilisé/étendu, primitives documentées + testées
- [ ] i18n — 6 valeurs visibles avec tiret long à corriger ; parité fr/en/teen OK par ailleurs
- [x] MDR 2017/745 — aucun seuil/alerte/interprétation
- [x] Sync mobile via syncHelpers ; `EntryKind` étendu sans cast
- [x] Config-first ; schéma (table SQLite locale, aucune table Supabase nouvelle)
- [x] Parité graphique web ≡ mobile
- [x] Documentation + tests pour toute surface ajoutée
