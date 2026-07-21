# Spec — Parcours d'exposition unifié (`exposure_journey`)

> Refonte mobile du module **Thermomètre de la peur** (`fear_thermometer`).
> Branche : `refonte-thermometre-de-la-peur`. Statut : **livré (mobile)**.
>
> Implémentation : layout `exposure_tracker` reconstruit (aucun nouveau
> `preview_kind` → câblage dispatcher/seed/web inchangé). Fichiers :
> `layouts/ExposureTracker/{ExposureTrackerLayout,LadderList,StepFormView,StepDetail,ExposureForm,SudsField,SudsBar,SessionCard,useExposureData,exposureLogic,types,styles}`.
> Tests : `exposureLogic.test.ts` (logique pure) + `FieldRenderer.exposure_tracker.test.tsx` (parcours).
> i18n : 25 clés × 4 locales (fr/en × common/teen). Modèle : 3 colonnes
> ajoutées à `fear_entries` (`suds_peak`, `expectation_text`, `outcome_text`).

## 1. Pourquoi

Le module existait en deux écrans cloisonnés qui partageaient pourtant les
mêmes tables :

- `fear_thermometer` (layout `exposure_tracker`) — saisie riche (situation +
  SUDS avant/après + stratégies + notes) mais en **liste à plat**, sans échelle
  ni courbe.
- `exposure_hierarchy` (layout `exposure_hierarchy`) — **échelle classée** +
  courbe de progression par situation, mais saisie pauvre.

Les outils de référence les plus utilisés et les mieux notés (Mayo Clinic
Anxiety Coach, MindShift CBT / AnxietyCanada, *Exposure: Face Your Fears*)
convergent tous sur **un seul parcours** :

> **Mes peurs (échelles)** → **marches classées** (du moins au plus
> angoissant, niveau cible) → **expositions répétées** vécues comme une
> *expérience* (je prédis → je vis → je compare) → **courbe** de l'angoisse
> de cette marche au fil des fois.

On unifie donc les deux écrans en un seul layout générique `exposure_journey`,
branché sur `fear_thermometer` (le nom que les patients connaissent).

Références : voir la conversation de conception (méta-analyses Linardon 2024
*World Psychiatry*, Wu 2021 *NPJ Digital Medicine* ; Mayo Anxiety Coach).

## 2. Périmètre de cette passe

- **Mobile uniquement.** L'armoire praticien (web) n'est pas touchée pour
  l'instant : `fear_thermometer` reste débloquable comme aujourd'hui ;
  `exposure_hierarchy` est laissé tel quel (sa consolidation/retrait sera
  traitée avec le chantier web).
- Le module `fear_thermometer` passe de `preview_kind='exposure_tracker'` à
  `preview_kind='exposure_journey'`.

## 3. Conformité MDR 2017/745 — invariants

Le code **affiche, n'interprète jamais** :

- SUDS (0–100) affichés **bruts**, sans label de gravité ni couleur de jugement.
- Courbe = tracé neutre des valeurs saisies, **aucun** message « vous allez
  mieux / moins bien », aucune flèche de tendance, aucun seuil déclencheur.
- Le classement des marches est fait **par le patient** (pas d'algorithme).
- Champs « ce que je redoute » / « ce qui s'est passé » = **texte libre** du
  patient. Aucune comparaison automatique, aucune conclusion.
- Aucune notification conditionnée aux données.

## 4. Modèle de données

Tables existantes **conservées** (SQLite local, synchro `patient_entries`) :

| Table | Rôle dans le parcours |
|---|---|
| `exposure_hierarchies` (id, module_id, title) | une **peur / échelle** |
| `fear_situations` (id, label, hierarchy_id, target_suds, is_done) | une **marche** de l'échelle |
| `fear_entries` (…) | une **exposition** (séance) sur une marche |

### Évolution de `fear_entries` (additive, idempotente)

Trois colonnes ajoutées (migration `ALTER TABLE … ADD COLUMN` sous garde
`PRAGMA table_info`, comme l'existant) :

| Colonne | Type | Sens | Nullable |
|---|---|---|---|
| `suds_peak` | INTEGER | pic d'angoisse **pendant** l'exposition (0–100) | oui |
| `expectation_text` | TEXT | « ce que je redoute » saisi **avant** | oui |
| `outcome_text` | TEXT | « ce qui s'est réellement passé » saisi **après** | oui |

Correspondance des SUDS dans l'exposition enrichie :

- `suds_before` → **angoisse anticipée / au début**
- `suds_peak` *(nouveau)* → **pic**
- `suds_after` → **angoisse finale**

La courbe par marche trace **le pic** (`suds_peak`), avec repli sur
`suds_after ?? suds_before` pour les anciennes saisies sans pic.

Champs `strategies` / `custom_strategy` / `notes` : inchangés.

### Données héritées (hierarchy_id null)

Les situations héritées du `fear_thermometer` à plat ont `hierarchy_id = null`.
Le layout les regroupe sous une **échelle virtuelle « Mes situations »**
(sentinelle, non persistée) — **aucune migration destructive**. Les nouvelles
marches créées reçoivent un vrai `hierarchy_id`.

## 5. Écran unifié — navigation

Layout `exposure_journey`, machine d'état à 4 modes (comme
`exposure_hierarchy`, enrichi) :

```
ladder         → liste des peurs/échelles (+ échelle virtuelle si données héritées)
                 carte par échelle : titre, nb de marches, nb d'expositions
                 FAB « Ajouter une peur »
  steps        → marches d'une échelle, classées par target_suds ASC
                 carte par marche : libellé, SUDS cible, nb d'expositions,
                 coche neutre « fait » (is_done)
                 FAB « Ajouter une marche » (label + SUDS cible)
    detail     → courbe (pic au fil des séances + repère cible) +
                 liste des expositions passées (éditables) +
                 bouton « Faire une exposition »
      exposure → formulaire enrichi (un seul écran qui déroule) :
                 AVANT  : « ce que je redoute » + SUDS anticipé
                 PENDANT: pic
                 APRÈS  : SUDS final + « ce qui s'est passé »
                 stratégies (puces + libre) + notes
```

Retour arrière à chaque niveau. Suppression via `ConfirmDialog`.
Bandeau MDR (`DisclaimerBanner moduleKey="fear_thermometer"`) en tête de
l'écran `ladder`.

## 6. Config-first / i18n

- Tous les libellés viennent de la config (`exposure_tracker_config` étendu)
  et des clés i18n `modules.fear_thermometer.*` — **zéro texte en dur**.
- Nouvelles clés : `ladder_*`, `expectation_*`, `outcome_*`, `suds_peak_*`,
  `exposure_*`, etc. Ajoutées dans `fr/common`, `en/common`, `fr/teen`,
  `en/teen`.
- Le layout est **générique** : il dérive `moduleId` des fields, ne hardcode
  aucun nom de module (réutilisable par un futur module au même motif).

## 7. Architecture composants (un fichier = un composant)

```
layouts/ExposureJourney/
  ExposureJourneyLayout.tsx   ← machine d'état + orchestration (routeur de modes)
  LadderList.tsx              ← mode ladder
  StepList.tsx                ← mode steps
  StepDetail.tsx              ← mode detail (courbe + liste séances)
  ExposureForm.tsx            ← mode exposure (formulaire enrichi)
  useExposureData.ts          ← chargement + reload des 3 tables
  types.ts                    ← Mode union + props partagées
  styles.ts                   ← StyleSheet partagé
  index.ts                    ← export public
  *.test.tsx                  ← tests par pièce
```

Réutilise : `PipPicker`, `DesensitizationChart` + `ChartLegend`,
`DisclaimerBanner`, `useConfirmDialog`, `useToast`, `useTeen`/`TeenAccent`.

## 8. Service / sync

- `fearTrackerService.saveFearEntry` : payload étendu aux 3 nouveaux champs
  (sync via `syncUpsert`, `entry_kind='fear_entry'` inchangé).
- Aucun nouveau `EntryKind`.

## 9. Tests

- `useExposureData` / helpers purs (tri marches, série de pic, regroupement
  échelle virtuelle).
- Rendu de chaque mode (RNTL) : ladder vide/non vide, steps, detail avec/sans
  séances, formulaire (saisie + save appelle le service).
- Mock `useTeen` standard.

## 9bis. Révision lisibilité (2026-06-07, retour clinicien)

- **Graphique légendé** : `DesensitizationChart` gagne des props optionnelles
  `yAxisLabel` / `xAxisLabel` (rendues en `<Text>` autour du SVG) ; `StepDetail`
  passe « Niveau d'angoisse (0–100) » et « Séances (S1, S2, …) ».
- **Zéro jargon** : « SUDs » retiré de l'UI patient. La légende commune
  `common.chart_legend.initial_suds` devient « Niveau estimé au départ » / « Estimated
  level at the start » (bénéficie aussi à `exposure_hierarchy`). Définition d'échelle
  `scale_hint` (« 0 = aucune angoisse · 100 = angoisse maximale ») affichée dans le
  formulaire de marche et la section « Avant » de l'exposition.
- **Estimé ≠ objectif** : la valeur 0–100 d'une marche est le **niveau de stress
  estimé au départ** (sert à classer l'échelle + ligne de référence du point de
  départ), jamais un « objectif ». Pastille « Niveau de stress estimé : N » ;
  libellé/aide du formulaire clarifiés. `referenceScore` devient optionnel dans
  `DesensitizationChart` + `showReference` dans `ChartLegend` → pas de ligne de
  référence pour les marches héritées sans niveau estimé (au lieu d'une ligne à 50).
- **Vocabulaire harmonisé sur « stress »** (retour clinicien) : toute l'UI patient du
  module utilise « stress » (adulte ET ado, fr ET en) au lieu de mélanger « angoisse »
  et « niveau estimé ». Plus clair et cohérent.
- **Légende + ligne de référence retirées du graphique du module** (2ᵉ retour
  clinicien) : le graphique (points chiffrés + axes titrés) se suffit à lui-même ;
  `StepDetail` n'affiche plus `ChartLegend` ni `referenceScore`. Le niveau estimé reste
  visible sur la pastille de la marche et dans le formulaire. `ChartLegend` et
  `referenceScore`/`showReference` restent disponibles pour `exposure_hierarchy`.

## 9ter. Date d'exposition éditable (2026-06-07)

Le patient peut faire une exposition un jour et la saisir le lendemain → la **date est
modifiable** dans le formulaire (`ExposureForm`), via `DateTimePicker` (`mode="date"`,
`maximumDate = aujourd'hui` pour interdire le futur). `ExposureDraft.date` porte la
valeur (helpers locaux `parseISODate`/`toISODate`, en heure locale pour éviter les
décalages de fuseau) ; l'orchestrateur n'écrase plus la date avec `new Date()`. Clé
i18n `exposure_date`. À l'édition d'une exposition, la date existante est pré-remplie.

## 9quater. Aperçu praticien web (livré 2026-06-07)

Refonte de l'aperçu web (`preview_kind='exposure_tracker'`) au niveau de
`SliderDashboardLayout`. Orchestrateur interactif (état `view` ladder/detail/exposure)
dans `apps/web/.../layouts/ExposureTrackerLayout/` :
`ExposureTrackerLayout` + `ExposureLadderView` + `ExposureStepDetailView` +
`ExposureFormView` + `DesensitizationChartPreview` (SVG 0–100, points chiffrés, axes
titrés, sans légende/référence) + `SudsPickerPreview` + `SessionCardPreview` +
`exposureMock.ts` (données MOCK déterministes — jamais de vraies données patient).
CSS `ej-*` ajoutées à `ModulePreviewPanel.css` (tokens du design system, zéro hex).
Libellés via `t('modules.fear_thermometer.*')` → **portage i18n** du bloc complet vers
`apps/web/src/i18n/locales/{fr,en}/common.json` + clés d'exemple `preview_step_*`,
`preview_expectation`, `preview_outcome`. 4 tests Vitest. `preview_kind` inchangé →
zéro impact dispatcher/seed/type partagé.

## 9quinquies. Consolidation (2026-06-07)

- **Renommage affichage** : « Thermomètre de la peur » → **« Exposition graduée »**
  (EN « Graded Exposure »), toutes locales. L'**identifiant interne reste
  `fear_thermometer`** (aucune migration d'id).
- **Retrait du module `exposure_hierarchy`** (fusionné dans le parcours unifié) :
  - Base : suppression du module + `module_content_fields` + lignes `patient_modules`
    (4 patients, qui possédaient déjà `fear_thermometer` → aucune perte d'accès) ;
    sources `module_sources` **réaffectées** à `fear_thermometer`. Répercuté dans
    `seed.sql` + `sources_seed.sql`.
  - Code : `PreviewKind` (shared), dispatchers + layouts web/mobile supprimés,
    `ModulePreviewPanel`, `ModuleContentScreen`, `syncOutbox` (EntryKind),
    `fearTrackerService` (create/delete hierarchy), i18n (toutes locales), tests.
  - Dormant (laissé, inoffensif) : helpers SQLite bas-niveau `exposure_hierarchies`
    dans `lib/database.ts`.

## 9sexies. Redesign 2026-07 (#183) — mobile

Redesign de l'existant (pas une refonte), branche `refonte/exposition-graduee-mobile`.
Épic #185 (mobile #183 puis web #184). Objectif : neutralisation totale de la palette
(fin de tout codage de valence / gravité), saisie SUDS unique, restitution passive du
couple prédiction / résultat (apprentissage inhibiteur, Craske 2014).

- **Palette neutralisée** (`field_props` de `et.cfg`, jamais en dur) : anticipé lavande
  `#C9B8E4` (remplace `#EF4444`), pic teal `#6dbfc3` (nouveau `suds_peak_color`), final
  sauge `#A8D8C0` (remplace `#059669`). Barre de difficulté `ladder_bar_color`
  `#9AD3D6` ; texte de la pastille « Dernier pic » `last_peak_text_color` `#3E7C82`
  (teal assombri, contraste WCAG AA). Les défauts côté code sont eux-mêmes neutres.
- **Coche « terminé » (`is_done`) retirée de l'UI** (colonne conservée en base pour
  rétrocompat). Remplacée sur la carte marche par une **barre de difficulté
  proportionnelle** + la pastille passive **« Dernier pic X »** / « Pas encore essayée »
  + le **nombre d'expositions sur sa propre ligne**.
- **Une seule mécanique SUDS** : pastilles 0 à 100 (`RatingSelector variant="numbered"`)
  partout, création de marche incluse (le `variant="track"` de `StepFormView` est
  supprimé ; le variant reste dans le primitive partagé pour les autres modules).
  `SudsField` gagne une prop `legend` (légende « 0 = aucun stress… » sous les pastilles).
- **État vide (écran 0)** : composant `LadderEmpty` (illustration escalier pastel + CTA
  « Créer ma première situation » + nudge). Le bandeau `DisclaimerBanner` est retiré de
  la tête de l'échelle.
- **Brouillon (écran 3)** : bouton « Enregistrer et compléter après l'exposition »
  (`exposure_save_draft`) qui persiste la prédiction (avant seul) ; pic / final restent
  nuls et se complètent en rouvrant la même séance.
- **Détail (écran 5)** : carte « Difficulté estimée · X / Ré-évaluer » (re-cotation TCC,
  conserve l'historique) ; carte séance avec « Je redoutais : / Ce qui s'est passé : » ;
  CTA « + Faire une exposition » **dans le flux** (ne recouvre plus la dernière carte).
- **Renommages i18n** (nouvelles clés) : `step_target_suds_label` / `step_target_suds_short`
  (« Difficulté initiale estimée »), `step_difficulty`, `step_last_peak`, `step_not_tried`,
  `ladder_empty_cta` / `ladder_empty_nudge` / `ladder_sort_hint`, `exposure_save_draft(_hint)`,
  `detail_difficulty`, `detail_reevaluate`, `session_predicted_label`. Variante teen
  systématique (tutoiement professionnel). Anciennes clés `step_done` / `step_target` /
  `step_target_label` supprimées.
- **Design system** : tous les boutons d'action ad hoc (`Pressable + styles.xxxBtn`)
  migrés vers `@ui/Button` (FAB, CTA, retour, dates, suppression, icônes édition/poubelle).
- **Accessibilité** : textes secondaires ≥ 12,5 px, gris assombri `#7A8891` (AA 4,5:1),
  cibles ≥ 44 px (mode icône-seule de `ui/Button`).

## 10. Hors périmètre (suite)

- Rappels programmés d'exposition.
- Nettoyage optionnel des helpers SQLite `exposure_hierarchies` dormants.
- **Web praticien (#184)** : parité stricte avec ce redesign mobile (ticket suivant).
