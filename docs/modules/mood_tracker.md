# Module — Thermomètre de l'Humeur (`mood_tracker`)

## Base clinique

**Références :**
- Post, R.M. et al. (1988). *NIMH Life Chart Method* — gold standard en psychiatrie, notamment trouble bipolaire.
- Yatham, L.N. et al. (2018). *CANMAT and ISBD Guidelines for the Management of Bipolar Disorder.* Bipolar Disorders.
- Basco, M.R. & Rush, A.J. (2005). *Cognitive-Behavioral Therapy for Bipolar Disorder.* Guilford Press.
- NICE CG90 (2009, updated 2022). *Depression in adults: treatment and management.*

**6 dimensions — saisie quotidienne, échelle 1–10 :**

| Dimension | Terme patient | Justification clinique |
|---|---|---|
| **Humeur** | Humeur | Mesure universelle — utile tous diagnostics |
| **Énergie** | Énergie | Distingue les polarités bipolaires, prédit les rechutes |
| **Anxiété** | Anxiété | Comorbidité chez ~60 % des patients en psychiatrie (CANMAT 2018) |
| **Plaisir** | Plaisir | Critère DSM-5 cardinal de la dépression majeure (anhédonie, Snaith & Hamilton 1995) |
| **Sommeil** | Sommeil | 1=très peu/agité ↔ 10=très long/lourd — capture hyposomnie et hypersomnie (critère DSM dépression/manie) |
| **Alimentation** | Alimentation | 1=perte d'appétit ↔ 10=hyperphagie — critère DSM dépression/trouble bipolaire |

**Rythme :** une saisie par jour. Si une entrée existe déjà, elle peut être mise à jour.

---

## Conformité MDR 2017/745

Kær est un Carnet de Bord Numérique — non-Dispositif Médical.

- Les valeurs 1–10 sont des **chiffres bruts** saisis par le patient, affichés sans label interprétatif.
- Les graphiques sont neutres : aucune couleur d'alerte, aucune flèche, aucun commentaire automatique.
- Aucun seuil ne déclenche quoi que ce soit.
- L'interprétation appartient exclusivement au patient et au soignant en consultation.

---

## Architecture technique

### Stockage
- **Local uniquement** (offline-first) : table générique `scale_entries` dans SQLite (`psytool.db`)
- `scale_id = 'mood_tracker'`
- `subscale_scores` JSON : `{mood, energy, anxiety, pleasure, sleep, food}` (1–10)
- Ancienne table `mood_entries` conservée en lecture seule (migration bootstrap vers `scale_entries`)
- Migration backward-compatible : les anciennes entrées à 4 dimensions affichent `hasValue=false` pour sleep et food dans les graphiques
- **Repères temporels** : table SQLite locale `mood_markers` (`id`, `date`, `label`, `created_at`) — contexte saisi par le patient, jamais transmis au serveur

### Mention « Normal » sur les sliders (bidirectionnalité)
Chaque slider 1–10 affiche **3 repères** : bas (hypo), **« Normal » au centre** (en couleur, gras), haut (hyper).
Capture la lecture pathologique dans les deux sens — manie ↔ dépression, hyperphagie ↔ anorexie,
hypersomnie ↔ insomnie. Implémenté via la prop `mid_hint_code` (`field_props`) lue par `FieldRenderer`.

### Écran mobile — `MoodTrackerScreen.tsx`
- **Écran custom** (pas via ScaleHistory générique) — route `MoodTracker` dans AppStack
- 3 onglets via segment control (Pressable maison — pas de nested Tab Navigator)

| Onglet | Contenu |
|---|---|
| **Saisie** | Bouton "Nouvelle saisie" → ScaleEntryScreen (6 sliders) ; liste des entrées récentes avec chips colorés ; section rappel |
| **Évolution** | Sélecteur 7J/1M/3M/1A → CompositeChart (6 lignes overlay + moyenne grise épaisse + repères) + section Repères + 6 DimensionChart (barres 7J, courbes sinon) |
| **Vue d'ensemble** | Calendrier heatmap mensuel (cercles colorés selon moyenne du jour, opacité ∝ score, badge « X/Y jours saisis », navigation prev/next) |

> Les courbes connectent **tous** les points saisis, même non consécutifs (saut des jours vides).
> Graduation d'axe Y (1–10) discrète sur LineChart et CompositeChart.

### Repères temporels (Life Chart Method)
- Le patient marque un événement (« début lithium », « arrêt de travail »…) avec une date.
- Affiché comme **trait vertical pointillé numéroté** sur le CompositeChart + liste sous le graphe.
- Positionnement via `markerXFraction(date, range)` — calcul UTC aligné sur `buildChartData`.
- **MDR** : contexte brut saisi par le patient, aucune interprétation, aucune corrélation automatique.
- Référence : Post, R.M. et al. (1988). *NIMH Life Chart Method*.

### Librairie `TimeRangeCharts/`
Composants extraits, partagés avec `MedicationSideEffectsHistoryScreen` :

| Fichier | Rôle |
|---|---|
| `chartUtils.ts` | Fonctions pures : `buildChartData`, `buildCompositeData`, `buildXLabels`, `computeAvg`, `computeStreak`, `markerXFraction` (source unique, importée aussi par l'écran effets secondaires). Types `DataPoint`/`XLabel` ré-exportés depuis `ui/Chart`. |
| `DimensionChart.tsx` | Card = header (label + moyenne) + `BarChart`/`LineChart` **du design system** (`ui/Chart`) selon la plage, `yMax` configurable. Composant unique de mini-graphe par métrique (mood **et** effets secondaires). |
| `CompositeChart.tsx` | Multi-lignes overlay + moyenne épaisse + axe Y + repères verticaux (`ChartMarker[]`) + légende — pas d'équivalent au DS (multi-séries), reste sur mesure |
| `MonthCalendar.tsx` | Grille calendrier mensuelle, cercles colorés (opacité ∝ score) + badge de complétude |

> Les primitives `LineChart`/`BarChart` ne sont **pas** redéfinies ici : `DimensionChart`
> consomme `components/ui/Chart`. Le sélecteur de période réutilise `components/ui/PillSelector`
> (pas de `RangeSelector` dédié).

### Rappels
- Infrastructure Supabase `notification_routines` existante — aucune table supplémentaire
- Le praticien configure depuis PatientPage web (NotificationRoutineModal)
- Le patient ajuste l'heure dans l'onglet Saisie via un **modal JS** (deux champs heure/minute → `updateTimeOverride`)
- Pas de `@react-native-community/datetimepicker` (non supporté dans Expo Go SDK 53+)

### Aperçu web praticien — `SliderDashboardLayout` (`preview_kind='slider_dashboard'`, générique)
**Parité complète avec le mobile** — le praticien navigue dans les **3 mêmes onglets** :
- **Saisie** : 6 sliders (avec repère « Normal ») + notes + section rappel
- **Évolution** : badge streak + sélecteur 7J/1M/3M/1A + CompositeChart SVG (axe Y, 6 lignes + moyenne, repères verticaux) + liste des repères + 6 graphiques par dimension (barres 7J / courbes sinon, axe Y)
- **Vue d'ensemble** : calendrier mensuel heatmap (cercles colorés, opacité ∝ score, badge de complétude)
- Données 100% mock (preview uniquement — aucun appel Supabase). Les repères apparaissent/disparaissent selon la plage choisie, comme sur mobile.
- Toutes les clés i18n `modules.mood_tracker.*` copiées du mobile vers `apps/web/src/i18n/locales/{fr,en}/common.json`.

### Scoring
- `scaleScoring.ts` : `items_count=6`, formule moyenne des valeurs non-nulles
- `chips` : `[chip_mood, chip_energy, chip_anxiety, chip_pleasure, chip_sleep, chip_food]`

---

## Navigation

```
HomeScreen → CUSTOM_ROUTES['mood_tracker'] → 'MoodTracker' → MoodTrackerScreen
MoodTrackerScreen (onglet Saisie) → 'ScaleEntry' { scale_id: 'mood_tracker' }
```

---

## Seed SQL

```
module_content_fields : mood_tracker.instruction, q_mood(20), q_energy(30), q_anxiety(40),
                        q_pleasure(50), q_sleep(55), q_food(58), notes(60), footer(99)
field_props : couleur, icône, min/max, low_hint_code, high_hint_code par dimension
```

Couleurs des dimensions :
- Humeur : `#8B5CF6` (violet)
- Énergie : `#F59E0B` (ambre)
- Anxiété : `#EF4444` (rouge)
- Plaisir : `#059669` (vert foncé)
- Sommeil : `#0EA5E9` (bleu clair)
- Alimentation : `#10B981` (vert)

---

## Tests

Fichier : `apps/mobile/src/screens/modules/MoodTrackerScreen.test.tsx`

27 tests Jest couvrant :
- Chargement initial (ActivityIndicator)
- Rendu des 3 onglets
- Navigation vers ScaleEntry
- État vide sans entrées
- Affichage du badge streak
- Basculement vers onglet Évolution (CompositeChart + 6 DimensionChart)
- Basculement vers onglet Vue d'ensemble (MonthCalendar)
- Section rappel (aucun rappel / rappel actif)
- Confirmation de suppression
- Section repères affichée + ouverture du modal d'ajout
- `buildCompositeData` — hasValue=false / moyenne correcte / ignore dimensions absentes
- `computeStreak` — 0 sans entrée / jours consécutifs
- `markerXFraction` — bornes 0/1, milieu 0.5, hors fenêtre, date future, date invalide, plage 1M

---

## i18n

Namespaces : `fr/common.json`, `en/common.json`, `fr/teen.json`, `en/teen.json`

Clés ajoutées (refonte) : `dim_sleep*`, `dim_food*`, `dim_mid_normal`, `chip_sleep`, `chip_food`,
`tab_entry`, `tab_charts`, `tab_month`, `chart_section`, `chart_composite`, `chart_avg`,
`range_7j`, `range_1m`, `range_3m`, `range_1a`, `streak*`, `reminder_*`, `month_no_entry`,
`new_entry_btn`, `composite_legend`, `markers_title`, `markers_add`, `markers_empty`,
`markers_placeholder`
