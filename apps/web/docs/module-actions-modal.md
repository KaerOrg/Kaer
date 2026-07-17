# Modale d'actions d'un module (web praticien)

Toutes les actions praticien d'une carte module de l'armoire thérapeutique
(`PatientModulesTab`) sont regroupées dans **une seule modale à onglets**,
`ModuleActionsModal`. Chaque bouton de la carte ouvre cette modale sur l'onglet
correspondant ; l'utilisateur navigue ensuite librement entre les onglets.

## Onglets

Ordre d'affichage canonique : **Données → Configuration → Notifications → Sources →
Vue patient** (porté par `computeModuleTabs`).

| Onglet | Contenu | Composant |
|---|---|---|
| **Données** (`data`) | Vraies données patient synchronisées (graphiques / fiches / résumé) | `ModuleDataPanel` (routeur) |
| **Configuration** (`config`) | Éditeur de config propre au module (voir plus bas) | panneaux dédiés |
| **Notifications** (`notifications`) | CRUD des routines de rappel | `NotificationRoutinePanel` |
| **Sources & recommandations** (`sources`) | Références bibliographiques du module | `ModuleSourcesPanel` |
| **Vue patient** (`preview`) | Rendu de l'écran patient (FieldRenderer) | `ModulePatientViewPanel` |

> **Onglet Données — panneaux dédiés par module.** `ModuleDataPanel` route selon le
> type : agenda du sommeil → `SleepDataPanel`, **humeur → `MoodDataPanel`** (moyennes
> récentes 7 j / 1 mois + empreinte 6 barres, petits multiples par dimension avec
> « agrandir », détail au clic via `TrendChart` + repères + comparaison mois -1, liste
> des repères typés posés par le patient), rythmes → `ChronoDataPanel`, colonnes →
> `ColumnFormDataPanel`, activation → `BehavioralActivationPanel` ; sinon graphe
> générique `ModuleChart` ou tableau `ModuleSummaryPanel`. Le bloc humeur lit les
> repères via `engagementQueries.moodMarkers` (parité mobile #161). Aucune moyenne
> « bien-être » globale (MDR).

> Historique : les onglets **Vue patient** et **Sources** étaient auparavant des
> sous-onglets internes à `ModulePreviewPanel`. Ils sont désormais aplatis en onglets
> de premier niveau ; `ModulePreviewPanel` (page d'aperçu standalone) conserve ses
> sous-onglets et délègue la vue patient à `ModulePatientViewPanel`.

## Disponibilité des onglets

`moduleActionTabs.ts` → `computeModuleTabs(type, ctx)` calcule les onglets disponibles
(ordre canonique Données → Configuration → Notifications → Sources → Vue patient) selon
le module, l'état déverrouillé et les métadonnées d'échelle. Règles clés :

- **Vue patient / Sources** : selon `hasPreview` pour les échelles ; conditionné au
  déverrouillage pour certaines familles (médication, crise…) ; absent pour le RIM.
- **Données / Notifications** : uniquement une fois le module déverrouillé, et hors
  modules de configuration pure (psychoédu, plan de crise, RIM). Pas de notifications
  pour les échelles.
- **Configuration** : voir ci-dessous.

## Onglet Configuration : deux familles d'éditeurs

Le contenu de l'onglet Config est construit par `PatientModulesTab` (qui détient les
hooks d'édition) et injecté dans la modale via la prop `configPanel`. Les hooks sont
mono-instance : la même instance alimente le résumé de la carte et l'éditeur.

| Module | Panneau | Famille |
|---|---|---|
| `crisis_plan` | `CrisisPlanConfigPanel` | B : config après déverrouillage |
| `medication_side_effects` | `MedicationEffectsConfigPanel` | B |
| `medication_adherence` | `MedicationListConfigPanel` | B |
| `behavioral_activation` | `BAActivitiesConfigPanel` | B |
| `rim` | `RimConfigPanel` | A : config = geste de déverrouillage |
| `psychoeducation` | `PsychoLibraryPicker` | A |

- **Famille A (`rim`, `psychoeducation`)** : le formulaire de config **crée** le module.
  L'onglet Config est disponible même verrouillé (mode `unlock`) ; valider crée le
  module. Déverrouillé, l'onglet passe en mode `edit`.
- **Famille B** : le déverrouillage est un geste séparé (toggle) ; la config n'est
  éditable qu'ensuite.

### Coordination ouverture/fermeture

- `openConfig(type)` (bouton de carte) amorce l'éditeur du hook (`open('unlock'|'edit')`
  ou `openEditor()`) puis ouvre la modale sur l'onglet Config.
- Le changement d'onglet interne (`changeActiveTab`) amorce l'éditeur en entrant dans
  Config, le réinitialise en le quittant.
- La fermeture de la modale (`closeModal`) réinitialise l'éditeur si l'onglet Config
  était actif.
- `confirm`/`saveEditor` des hooks rim/psycho/crise retournent un **booléen de succès** :
  le panneau ne ferme la modale (`onClose`) qu'en cas de succès (sur échec de
  validation/écriture, l'éditeur reste ouvert avec son message d'erreur).

## Fichiers

```
apps/web/src/pages/PatientPage/tabs/
  ModuleActionsModal.tsx        ← modale à onglets (ui/Tabs + ui/Modal)
  moduleActionTabs.ts           ← computeModuleTabs (disponibilité)
  RimConfigPanel.tsx            CrisisPlanConfigPanel.tsx
  MedicationEffectsConfigPanel.tsx  MedicationListConfigPanel.tsx  BAActivitiesConfigPanel.tsx
apps/web/src/components/features/
  ModulePreviewPanel/ModulePatientViewPanel.tsx   ← vue patient extraite
  NotificationRoutinePanel/NotificationRoutinePanel.tsx
```
