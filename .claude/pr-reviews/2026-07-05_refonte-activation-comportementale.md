---
date: 2026-07-05
branch: refonte/activation-comportementale
pr_number: 111
pr_url: https://github.com/KaerOrg/Kaer/pull/111
ci_pass: true
merge_clean: true
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 1
  tests: 1
  docs: 0
  design_system: 1
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
  correctness_timezone: 1
warnings: 5
files_created: 23
files_modified: 38
rules_enriched: 2
---

# PR Review — refonte/activation-comportementale (#111)
Date : 2026-07-05

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreur, warnings `jsx-no-bind` préexistants) |
| test-web | `cd apps/web && npx vitest run` | ✅ (975 passed, 6 todo) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (909 passed) |

## Synchronisation avec main
- Merge `origin/main` : **propre** (auto-merge `ort`, sans conflit)
- Fichiers en conflit résolus : aucun

## Fichiers analysés
- Créés : 23 fichiers
- Modifiés : 38 fichiers

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 4 |
| ⚠️ Points d'attention | 5 |
| ✅ Conformes | l'essentiel du diff |

Refonte de grande qualité : migration SQLite v2 propre et testée, séparation config-first exemplaire (domaines/suggestions en seed, `field_props` atomiques), parité web ≡ mobile intégralement câblée, arithmétique de dates factorisée dans `@kaer/shared`, garde-fou `noRawFetch` correctement étendu. Les points ci-dessous restent à traiter.

---

## 🚫 VETO MDR
Aucun. Valeurs brutes uniquement, `null` = « non renseigné » assumé, zéro seuil/alerte/interprétation. Le codage visuel réalisée/planifiée et l'agrégation des moyennes journalières sont **côté praticien** (autorisé), commentés comme tels.

---

## 🚫 Violations bloquantes

### `apps/mobile/.../ActivityLog/EntryForm.tsx`

**Ligne 111 — [Correctness / fuseau horaire]**
```ts
date: entryDate.toISOString().slice(0, 10),
```
`toISOString()` convertit en **UTC** : pour tout fuseau à offset positif (toute l'Europe, dont la France, cœur de cible), la date métier est **décalée d'un jour en arrière**. Cas reproductible à 100 % : ouvrir une activité existante puis Enregistrer → `new Date(\`${date}T00:00:00\`)` (minuit local) `.toISOString()` retombe sur la veille (22:00 UTC) → l'activité change de jour. Une activité planifiée « aujourd'hui » peut ainsi basculer dans l'onglet Historique (`records.filter(r => r.date >= todayIso())`). La date fautive se propage aussi au web (`fetchActivityEntries` date par `payload.date`).
→ Formater depuis les composants **locaux** (comme `weekDates.toIso` : `getFullYear`/`getMonth`/`getDate`), jamais `toISOString`. Le module `@kaer/shared/services/weekDates` existe précisément pour ça (commentaire explicite « minuit UTC vs minuit local ») : exposer un `toIsoDate(d: Date)` partagé et l'utiliser ici.

### `apps/mobile/.../ActivityLog/EntryForm.tsx` + `styles.ts`

**EntryForm ligne 246 / styles ligne 95 — [Design system]**
```tsx
<Pressable style={alStyles.confirmBtn} onPress={() => setShowDatePicker(false)}>
  <Text style={alStyles.confirmBtnText}>{lbl('date_confirm_label')}</Text>
</Pressable>
```
`confirmBtn` (fond `colors.primaryLight` + radius + padding + texte teinté) reproduit exactement `ui/Button`. `Pressable + Text + styles.xxxBtn` quand `ui/Button` existe = violation bloquante (cf. lessons § refonte/chronobiologie).
→ `<Button variant="secondary" size="sm" label={lbl('date_confirm_label')} onPress={...} />`, puis supprimer `confirmBtn`/`confirmBtnText` de `styles.ts`.

### `apps/web/.../layouts/ActivityLogLayout/ActivityLogLayout.tsx`

**Lignes 83 et 92 — [i18n]**
```tsx
<span className="al-list__title al-list__title--done">Marche en forêt</span>
...
<span className="al-list__title">Yoga matinal</span>
```
Libellés d'exemple **codés en dur en français** dans l'aperçu praticien. Aucun autre layout d'aperçu web ne hardcode de texte d'exemple (vérifié). Un praticien en UI anglaise verra « Marche en forêt ».
→ Résoudre via des clés i18n dédiées (`modules.behavioral_activation.preview_sample_*`) ou des placeholders neutres. (Idem ligne 50, cf. point d'attention locale.)

### `apps/web/.../tabs/BehavioralActivationCard.tsx` + `BAActivityAddForm.tsx`

**[Tests / couverture]**
Aucun test direct pour ces deux composants, alors que leur miroir `MedicationAdherenceCard` **a** son `MedicationAdherenceCard.test.tsx`. `BAActivityAddForm` porte une vraie logique non couverte (input `label` contrôlé pilotant `disabled`, `valueText` non contrôlé lu au submit, soumission sur Entrée, trim + reset). `useBAActivitiesEditor` est testé, mais pas les composants qui le consomment.
→ Ajouter `BAActivityAddForm.test.tsx` (rendu + submit valide/invalide + reset) et un test de `BehavioralActivationCard` aligné sur `MedicationAdherenceCard.test.tsx`.

---

## ⚠️ Points d'attention

### `apps/mobile/.../ActivityLog/styles.ts`
**Ligne 69 — [Design system / tokens]** Le `fab` code son ombre en dur (`shadowColor: '#000', shadowOffset, shadowOpacity: 0.2, shadowRadius, elevation`) alors que le `sheet` du même fichier utilise `...shadows.md`. → Utiliser `...shadows.md` (ou étendre les tokens `shadows` si le FAB veut une ombre plus marquée).

### `apps/mobile/.../ActivityLog/EntryForm.tsx`
**Ligne 224 — [React Native / design system]** Le déclencheur de date est un `TouchableOpacity` ad hoc (icône + valeur), tandis que l'analogue **heure** juste en dessous utilise le primitive `<TimePicker>`. Incohérence + `Pressable > TouchableOpacity`. Aucun `DatePicker` n'existe encore en `ui/` (non bloquant). → À terme, extraire un `ui/DatePicker` jumeau de `TimePicker` ; a minima passer en `Pressable`.

### `apps/mobile/.../ActivityLog/ActivityListCard.tsx` (+ AgendaView/ListView)
**[Render / perf]** `ActivityListCard` (item de liste à logique) n'est pas `React.memo`, et `AgendaView`/`ListView` lui passent des closures inline dans le `.map()` (`onToggleDone={() => onToggleDone(r)}`, etc.). Incohérent avec `PickChip` (soigneusement mémoïsé + callback stable) et avec la règle « items de liste → composant dédié + `React.memo` ». → Mémoïser `ActivityListCard` et stabiliser les callbacks (id passé en prop, handler `useCallback` par item comme `PickChip`).

### `apps/web/.../layouts/ActivityLogLayout/ActivityLogLayout.tsx`
**Ligne 50 — [i18n]** `new Date().toLocaleDateString('fr-FR', …)` : locale figée en dur dans l'aperçu. → Dériver de `i18n.language` (le composant reçoit déjà `t`).

### Micro — libellés de repli codés en dur
`pShort = lbl('pleasure_short_label') || 'P'` / `'M'` (ActivityListCard mobile ligne 28-29, ActivityLogLayout web ligne 36-37). Repli défensif visible. Mineur : les valeurs réelles viennent de l'i18n via `lbl`, mais le fallback reste du texte en dur.

---

## ✅ Points positifs
- **Migration SQLite v2 exemplaire** : `ACTIVITY_RECORDS_REBUILD_STATEMENTS` + `needsActivityRecordsRebuild` (fonction pure testée), mapping legacy documenté (planifiée→attendus, réalisée→ressentis).
- **Config-first parfait** : domaines de vie et suggestions en seed (`activity_log_domain`/`activity_log_suggestion`), `field_props` **atomiques** (`domain` = un id, bornes d'échelle en props frères `pleasure_min/max/step`). Zéro tableau TS de contenu.
- **Parité web ≡ mobile complète** : `BehavioralActivationPanel` câblé dans `ModuleDataPanel` **et** `PatientEvolutionTab` ; statut `activity` ajouté à `ModuleDataResult` ; datation par `payload.date` (date métier) côté web comme mobile.
- **Arithmétique de dates factorisée** dans `@kaer/shared/weekDates` (ancrage midi local, anti-décalage TZ) + tests — c'est le geste correct (dommage qu'`EntryForm` ne le réutilise pas, cf. violation #1).
- **`syncUpsert` préservé** : `activityRecordService` enrichit le payload sans jamais court-circuiter la sync outbox.
- **`noRawFetch.guard` étendu** avec justification (`fetchBAActivities` en amorçage one-shot), garde-fou respecté.
- **Séparation des couches** : `BehavioralActivationPanel`/`BAScoreLine` présentationnels (données par props), lecture via services + React Query, éditeur praticien via `useBAActivitiesEditor` (hook testé).
- **Contrôlé vs non contrôlé** correctement arbitré dans `BAActivityAddForm` (label contrôlé, valueText en `ref`).
- **`CompletionSheet`** : justifie en JSDoc pourquoi `ui/ActionSheet` ne convient pas — bon réflexe design-system.
- **Couverture d'intégration mobile riche** : 18 tests montent le vrai `ActivityLogLayout` (agenda/historique/entry/completion, sans mock des sous-composants).
- Nouveau token `colors.overlay` ajouté au thème au lieu d'un `rgba` en dur.

---

## Checklist finale
- [x] MDR — aucun seuil/alerte/interprétation ; agrégation praticien assumée
- [x] Zéro Supabase/SQLite direct dans un composant (services + `lib/database` wrappers)
- [x] TypeScript strict — zéro `any`/`as unknown`/suppression dans le diff
- [x] Config-first — contenu en seed, `field_props` atomiques
- [x] i18n parité fr/en (common) + teen (mobile) — les 3 clés hors teen (`label`/`description`/`empty_description`) suivent la convention établie (aucun module ne les traduit en teen)
- [x] Sync mobile via `syncUpsert` ; `entry_kind='activity_record'` (union, zéro cast)
- [x] Parité graphique web ≡ mobile câblée
- [x] Schéma — `schema.sql` non requis (SQLite local + `patient_entries` jsonb)
- [x] Docs mises à jour (behavioral_activation.md +130l, module-engine.md, modules.md, roadmap)
- [ ] **Date métier fuseau-safe (violation #1)**
- [ ] **`ui/Button` pour le bouton de confirmation (violation #2)**
- [ ] **Zéro texte d'exemple FR en dur dans l'aperçu (violation #3)**
- [ ] **Tests des composants `BehavioralActivationCard` / `BAActivityAddForm` (violation #4)**
