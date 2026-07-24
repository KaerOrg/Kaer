# Spec · Armoire thérapeutique : Modules & Échelles en liste, à parité de fonctionnement

> **Type** : Epic de refonte · **App** : Kær web (praticien) · **Surface** : page patient (`apps/web/src/pages/PatientPage/`)
> **Statut** : spec de cadrage. Source de vérité = le code ; cette spec en dérive la cible.
> **Maquettes** : livrées par le référent produit (7 captures `K-1` à `K-7`). Chaque story indique laquelle.

## Intention

Réorganiser l'« Armoire thérapeutique » de la page patient : passer les **Modules** d'une grille de cartes à une **vue tableau** dense et alignée, sortir les **échelles et questionnaires** dans un onglet jumeau, et donner à chaque échelle un encart détail avec **programmation** des auto-questionnaires. Même grammaire visuelle et même fonctionnement pour les deux familles (modules et échelles), au vocabulaire près.

## Principe directeur : RÉUTILISER, ne pas recréer

La maquette est une spec visuelle. Deux réutilisations sont structurantes :

1. **L'onglet « Évolution » n'est pas une création.** C'est le composant `PatientEvolutionTab` déjà codé, qu'on **déplace** du niveau sidebar au niveau sous-onglet, filtré par famille (modules ou échelles). Bandeau d'aperçu, sections repliables, lien « Voir les données », toggle archivés, sélecteur de période : tout existe.
2. **L'encart au clic sur une échelle réutilise la modale existante** `ModuleActionsModal` et ses panneaux (Vue patient, Données, Sources). On **ajoute** seulement un onglet **Programmation** pour les auto-questionnaires.

---

## Cartographie du code réel (audit du 2026-07-24)

Références exactes à respecter par l'implémentation. Les libellés de la maquette ne collent pas toujours au code : cette table fait foi.

| Élément | Chemin réel | Rôle |
|---|---|---|
| Page patient + nav | `apps/web/src/pages/PatientPage/PatientPage.tsx` | Sidebar verticale (`ui/Tabs variant="vertical"`), onglet actif = state `activeTab` (`overview \| modules \| notes \| rdv \| evolution`), liste `PATIENT_TABS` |
| Onglet Modules | `apps/web/src/pages/PatientPage/tabs/PatientModulesTab.tsx` | Grille de `ModuleCard` (`div.category-modules-grid`), `renderModuleCard` |
| Carte module/échelle | `apps/web/src/components/features/ModuleCard/ModuleCard.tsx` | Shell présentationnel (assemble `ui/Card`) : icône + titre + contrôle + description + tags + actions |
| Onglet Évolution | `apps/web/src/pages/PatientPage/tabs/PatientEvolutionTab.tsx` | Reçoit `patientId` + `onOpenModuleData` |
| Bandeau aperçu | `apps/web/src/components/features/EvolutionOverviewBand/` | Barre sticky de mini-cartes, scroll-spy vers `#evo-section-<module>` |
| Sections repliables | `apps/web/src/components/features/EvolutionSection/` | Titre, badge nb sessions, ancre, lien « Voir les données » (`onViewData`) |
| Callback « Voir les données » | `onOpenModuleData` (prop de `PatientEvolutionTab`) → `handleOpenModuleData` (PatientPage) → `openDataFor` (PatientModulesTab) → ouvre `ModuleActionsModal` sur l'onglet `data` |
| Modale d'actions | `apps/web/src/pages/PatientPage/tabs/ModuleActionsModal.tsx` | Onglets `ui/Tabs`, ordre canonique `TAB_ORDER` |
| Ordre des onglets | `apps/web/src/pages/PatientPage/tabs/moduleActionTabs.ts` (`computeModuleTabs`) | `data → config → notifications → preview → sources` (`preview` = libellé « Vue patient ») |
| Vue patient | `apps/web/src/components/features/ModulePreviewPanel/ModulePatientViewPanel.tsx` | Rend l'écran patient via `FieldRenderer` (cas défusion → `DefusionPatientView.tsx`) |
| Panneaux Données | `apps/web/src/pages/PatientPage/tabs/ModuleDataPanel.tsx` (routeur) + `ExposureDataPanel` (module `fear_thermometer`), `DefusionDataPanel` (module `cognitive_saturation`), `SleepDataPanel`, `MoodDataPanel`, `ChronoDataPanel`, `ColumnFormDataPanel`, `BehavioralActivationPanel` | Self-fetch + dispatch par `chartKind` |
| Sources | `apps/web/src/components/features/ModuleSources/ModuleSourcesPanel.tsx` | Data via `moduleSourcesService` |
| Service échelles | `apps/web/src/services/scaleService.ts` (`fetchScaleMeta` → `ScaleMetaRow[]`) | Métadonnées lues en base (`module_content_fields` `field_type='scale_meta'` + `field_props`), config-first |
| Distinction Auto/Hétéro | champ `evaluationType: 'auto' \| 'hetero'` (prop base `evaluation_type`, défaut `auto`). Aucune autre heuristique |
| Hook échelles | `apps/web/src/hooks/queries/scaleQueries.ts` (`scaleQueries.meta()`) | |
| Badge Auto/Hétéro | `apps/web/src/components/features/ScaleMetaBadges/ScaleMetaBadges.tsx` | Badge éval (`--auto`/`--hetero`, i18n `scales.eval_auto`/`scales.eval_hetero`) + chip catégorie |
| Filtres | `apps/web/src/components/features/ModuleFilterBar/` + `apps/web/src/lib/moduleFilter.ts` + `apps/web/src/hooks/useTagFilters.ts` | Facettes de taxonomie (indication, public), pilotées base ; barre active au-delà de `ACTIVE_FILTER_THRESHOLD = 8` |
| Courbes | `apps/web/src/components/ui/Chart/LineChart/LineChart.tsx` | Courbe générique |
| Config courbes échelles | `apps/web/src/pages/PatientPage/tabs/clinicalChartConfig.ts` (`SCALE_CONFIG`, `MODULE_EVOLUTION_CONFIG`, `ModuleCadence`) | Couleur + borne Y par échelle. **Pas de `SCALE_SCORING`** ; agrégation dans `lib/chartConfig.ts` + `lib/chartAggregation.ts` |
| Date de déblocage | `patient_modules.unlocked_at`, affiché via i18n `patient.unlocked_on` | Ligne de date dans la carte |
| Rappels (base la plus proche de la « programmation ») | `apps/web/src/components/features/NotificationRoutinePanel/` + `notificationRoutineService` + table `notification_routines` (`days_of_week`, `time_of_day`, `Frequency`) | Rappel de notification par module. **N'est pas** une programmation de passation d'échelle |

## Les 3 écarts spec → réel (à assumer dans l'implémentation)

1. **L'onglet « Échelles & questionnaires » n'existe pas.** Aujourd'hui, les échelles sont des **cartes dans l'onglet Modules** (`PatientModulesTab`, branche `scaleMeta`). La story K-4 est donc une **vraie création** d'onglet sidebar + page, et un **retrait** des cartes d'échelle de l'onglet Modules (les modules « outils » restent, les échelles migrent).
2. **La programmation d'auto-questionnaires récurrents n'existe pas.** Aucun envoi récurrent programmé d'une échelle au patient. K-6 (onglet Programmation) et K-7 (colonne « Programmée » + rappel en retard) sont **à construire** : nouveau modèle de données (table + service + RLS), nouveau panneau. Base la plus proche à réutiliser comme socle : `NotificationRoutinePanel` / `notification_routines`.
3. **Corrections de nommage** : dossier `ModulePreviewPanel` (et non `ModulePatientViewPanel`) ; dossier `ModuleSources` ; onglet interne `preview` = libellé « Vue patient » ; `SCALE_CONFIG` (pas `SCALE_SCORING`) ; `ExposureDataPanel` porte le module `fear_thermometer` ; `DefusionDataPanel` porte `cognitive_saturation`.

## Note MDR 2017/745 (à valider par le référent qualité/réglementaire)

Planifier et rappeler (calendrier) ne poursuit pas en soi une finalité médicale (MDCG 2019-11). La bascule en dispositif médical vient de l'**interprétation** : cadence suggérée selon l'état clinique, alerte de score sur seuil, flag de risque automatique. Donc, pour ces stories :

1. Cadence **choisie par le praticien**, jamais suggérée par l'app.
2. Rappels en **langage neutre** (« passation prévue », jamais « réévaluation recommandée »).
3. **Scores bruts**, aucune couleur de gravité clinique.
4. **C-SSRS** : capture + interprétation humaine, aucun flag automatique.

Rappel de la règle d'or Kær : le code affiche, jamais il ne conclut. Un état « en retard » est un fait administratif (date dépassée), pas un signal clinique : teinte ambre neutre, pas de rouge de gravité.

## Portée

- Modules : cartes vers tableau, sous-onglets Actifs / Évolution.
- Nouvel onglet Échelles & questionnaires : tableau jumeau + sous-onglets Actives / Évolution.
- Encart détail au clic (module et échelle), point d'entrée constant.
- Colonne « Programmée » + programmation des auto-questionnaires + rappel des auto en retard.

## Hors-scope (décisions tranchées)

- **Pas de programmation des hétéro** (ni sur l'échelle, ni à la prise de RDV) : le soignant décide en séance. Clic sur un hétéro = « Démarrer la passation ».
- Pas de séparation « échelle » vs « questionnaire » en rangements distincts : un seul rayon, distinction portée par le badge Auto / Hétéro.
- Le rappel sur la fiche patient ne concerne que les **auto en retard**, pas les hétéro « prévus en séance ».

---

## Stories

### K-1 · Modules : grille de cartes vers tableau (maquette `K-1_modules-tableau_3a`)

**Pourquoi.** Trop de modules rendent les cartes illisibles ; le tableau densifie et aligne.

**Ce qui change.** Remplacer la grille de `ModuleCard` (`PatientModulesTab`) par un tableau 5 colonnes : **Module** (icône + nom + description tronquée 1 ligne) · **Indications** (chips, max 2 + `+N`) · **Débloqué le** · **Dernière activité** · **Activé** (toggle).

**Détails techniques.** Grille CSS en `minmax(0, …fr)` (le `fr` seul se cale sur le contenu et désaligne les colonnes d'une ligne à l'autre). Description sur 1 ligne, `text-overflow: ellipsis`. Le nouveau tableau est un composant `features/` réutilisable (il servira aussi K-4). Réutiliser la barre de filtres existante (`ModuleFilterBar`, dimensions indication/public), le handler du toggle d'activation, l'i18n, les tokens du design system.

**Critères d'acceptation.**
- [ ] Colonnes strictement alignées sur toutes les lignes.
- [ ] 15+ modules lisibles sans scroll excessif ; plus aucune carte.
- [ ] Tri par « Débloqué le » et « Dernière activité ».
- [ ] Filtres indication/public conservés ; toggle d'activation fonctionnel.
- [ ] Composant tableau extrait dans `features/`, testé, documenté (design-system.md).

### K-2 · Modules : sous-onglets « Actifs » / « Évolution » + réintégration de l'Évolution existante (maquette `K-2_modules-evolution_3c`)

**Pourquoi.** Chaque donnée doit vivre à côté de ce qui la produit ; l'onglet Évolution global de la sidebar disparaît.

**Ce qui change.** Sous le titre « Modules », ajouter deux sous-onglets : **Actifs** (le tableau K-1) et **Évolution**. Retirer l'entrée « Évolution » de la sidebar de premier niveau (aujourd'hui montée conditionnellement dans `PATIENT_TABS`).

**Réutiliser, ne pas recréer.** Le sous-onglet Évolution monte le `PatientEvolutionTab` existant, **filtré aux modules** (hors échelles). Conserver tel quel : `EvolutionOverviewBand`, `EvolutionSection` (repliables), `onOpenModuleData`, toggle « Afficher les archivés », `SegmentedControl` de période.

**Critères d'acceptation.**
- [ ] L'Évolution affiche exactement les mêmes courbes/sections qu'avant (filtrées aux modules) ; aucun composant de graphe réécrit.
- [ ] L'ancienne entrée « Évolution » est retirée de la sidebar.
- [ ] « Voir les données » ouvre bien la modale sur l'onglet Données du module.

### K-3 · Fiche module au clic sur une ligne (maquette `K-3_fiche-module_3b`)

**Ce qui change.** Clic sur une ligne du tableau ouvre la fiche du module (au lieu des boutons de carte). Actions au **survol de ligne** (données, notifications, aperçu, config).

**Réutiliser.** La modale existante `ModuleActionsModal`, ordre d'onglets canonique inchangé (`computeModuleTabs` / `TAB_ORDER` : `data → config → notifications → preview → sources`, config seulement si le module en a un). Panneaux existants (`ExposureDataPanel`, `ModulePatientViewPanel`, etc.).

**Critères d'acceptation.**
- [ ] Aucune action perdue par rapport aux cartes ; aucune nouvelle modale créée.
- [ ] Le démarrage d'une passation n'est jamais déclenché en un seul clic depuis le tableau.
- [ ] La ligne entière est une surface cliquable (primitive de surface, pas un `<button>` nu).

### K-4 · Nouvel onglet « Échelles & questionnaires » : tableau jumeau (maquette `K-4_echelles-tableau_4a`)

**Pourquoi.** Parité avec Modules, un seul langage visuel. Écart réel : cet onglet **n'existe pas**, les échelles sont aujourd'hui des cartes dans l'onglet Modules ; il faut les en **sortir**.

**Ce qui change.** Nouvel onglet sidebar + page, même squelette que Modules : sous-onglets **Actives / Évolution**, même composant tableau que K-1. 1ʳᵉ colonne = **Échelle / questionnaire** avec badge **Auto** (bleu) / **Hétéro** (vert) accolé au nom (réutiliser `ScaleMetaBadges`). 4 autres colonnes identiques. C-SSRS en tête (toujours disponible, `noToggle`, sans déblocage). Filtre **Type** (Auto/Hétéro, sur `evaluationType`) à la place de « Public ».

**Réutiliser.** Composant tableau de K-1, `scaleService` (`fetchScaleMeta`) + `scaleQueries.meta()`, `ScaleMetaBadges`. Retirer la branche échelle de `renderModuleCard` dans `PatientModulesTab`.

**Critères d'acceptation.**
- [ ] Visuellement et fonctionnellement identique au tableau Modules, au vocabulaire près.
- [ ] Les échelles n'apparaissent plus dans l'onglet Modules.
- [ ] Badge Auto/Hétéro sur chaque ligne ; C-SSRS en tête sans toggle ; filtre Type opérationnel.

### K-5 · Échelles : sous-onglet « Évolution » = plan de mesure (maquettes `K-2_modules-evolution_3c` réf. + `K-5-K-7_programmee_5a`)

**Ce qui change.** Sous-onglet Évolution des échelles, sur le pattern de K-2 : cadence, dernières passations, scores bruts, courbes.

**Réutiliser.** Même socle `PatientEvolutionTab` / `EvolutionSection` que K-2, **filtré aux échelles** ; `LineChart` existant, `SCALE_CONFIG` (dans `clinicalChartConfig.ts`).

**Critères d'acceptation.**
- [ ] Scores bruts, aucune couleur de gravité (MDR).
- [ ] « Voir les données » ouvre l'onglet Données de l'échelle.
- [ ] Aucune courbe réécrite ; réutilisation de `LineChart` + `SCALE_CONFIG`.

### K-6 · Encart échelle au clic : Vue patient · Données · **Programmation** · Sources (maquettes `K-6_encart-auto_6a` + `K-6_encart-hetero_6b`)

**Ce qui change.** Clic sur le nom d'une échelle ouvre **toujours le même encart** (point d'entrée constant, comme les modules). Le contenu s'adapte au type :
- **Auto** (`6a`) : onglet **Programmation** actif. Mode (à domicile / en séance), fréquence en préréglages (hebdo, 2 sem, mensuel, trimestriel, à la demande), jour + heure + fin, rappel patient ; boutons « Faire passer maintenant » (secondaire) et « Enregistrer la programmation » (principal).
- **Hétéro** (`6b`) : bloc « Démarrer la passation » (remplie en séance, rien n'est envoyé au patient). **Aucune programmation.**

**Réutiliser + ajouter.** Réutiliser `ModuleActionsModal` + onglets **Vue patient / Données / Sources** existants ; **ajouter** l'onglet **Programmation** (nouveau) pour les auto. Écart réel : la programmation est **à créer intégralement** (nouveau modèle de données + service + RLS + panneau) ; s'inspirer de `NotificationRoutinePanel` / `notification_routines` comme socle de récurrence.

**Trois verbes à ne pas confondre.** Activer ≠ Programmer ≠ Faire passer.

**Critères d'acceptation.**
- [ ] Geste unique et prévisible ; l'encart est le même pour auto et hétéro, seul le contenu change.
- [ ] Hétéro sans aucune option de programmation.
- [ ] Cadence choisie par le praticien, wording neutre, aucune relance déclenchée par un score (MDR).
- [ ] Accès aux données de programmation par un service dédié (zéro Supabase dans le composant) + RLS ; couvert par tests.

### K-7 · Colonne « Programmée » (remplace « Débloqué le ») + rappel auto en retard (maquette `K-5-K-7_programmee_5a`)

**Ce qui change.** Dans le tableau des échelles, « Débloqué le » descend dans la fiche (onglet Configuration) et laisse place à **« Programmée »** :
- **Auto** : mode (à domicile) + cadence + prochaine date + cloche de rappel ; état **en retard** mis en évidence (ambre, neutre).
- **Hétéro** : « En séance · à la demande », sans date.
- **Non planifié** : « Non programmée » + action « Programmer ».

Bandeau fiche patient : rappel des **auto en retard uniquement** (pas de « prévu en séance »).

**Critères d'acceptation.**
- [ ] Aucune date fantaisiste pour les hétéro.
- [ ] Rappel strictement administratif (langage neutre, teinte ambre non clinique).
- [ ] « Débloqué le » toujours consultable dans la fiche (onglet Configuration).
- [ ] État « en retard » dérivé de la date de programmation (fait administratif), jamais d'un score.

---

## Ordre de réalisation conseillé

K-1 → K-2 → K-3 (Modules complets), puis K-4 → K-5 → K-6 → K-7 (Échelles + programmation). La programmation (K-6, K-7) est le plus gros chantier (modèle de données neuf) et le point réglementaire : à traiter en dernier, avec validation MDR du référent.

## Correspondance stories / maquettes

| Story | Maquette(s) |
|---|---|
| K-1 | `K-1_modules-tableau_3a` |
| K-2 | `K-2_modules-evolution_3c` |
| K-3 | `K-3_fiche-module_3b` |
| K-4 | `K-4_echelles-tableau_4a` |
| K-5 | `K-2_modules-evolution_3c` (réf.) + `K-5-K-7_programmee_5a` |
| K-6 | `K-6_encart-auto_6a` + `K-6_encart-hetero_6b` |
| K-7 | `K-5-K-7_programmee_5a` |
