# C-SSRS — Version de Dépistage (Screen)

## Référence

Posner K, Brown GK, Stanley B, Brent DA, Yershova KV, Oquendo MA, Currier GW, Melvin GA, Greenhill L, Shen S, Mann JJ.
**The Columbia-Suicide Severity Rating Scale: initial validity and internal consistency findings from three multisite studies with adolescents and adults.**
Am J Psychiatry. 2011;168(12):1266-1277.
PubMed: https://pubmed.ncbi.nlm.nih.gov/22193671/

Traduction française officielle : Columbia University / NIMH.

> ⚠️ **Vérifier le libellé exact de chaque item contre la version PDF officielle Columbia avant toute mise en production commerciale.**
> La version française officielle est disponible sur le site Columbia Psychiatry.

## Description clinique

La C-SSRS (Columbia Suicide Severity Rating Scale) est l'échelle de référence internationale pour l'évaluation standardisée de l'idéation et des comportements suicidaires. La version de dépistage (Screen) est utilisée pour le repérage rapide en consultation ou entre deux séances.

**Population cible :** 15 ans et plus.
**Mode d'administration :** Hétéro-évaluation par le clinicien (standard) ou auto-évaluation (version Self-Report — utilisée dans Kær).
**Durée :** 5-10 minutes.

## Structure de l'échelle

### Section A — Idéation suicidaire (5 items)
Période de référence : **dernier mois**.
Réponses : Oui / Non.

| Item | Type | Description |
|------|------|-------------|
| 1 | Désir passif de mort | Souhaiter être mort ou endormi pour ne plus se réveiller |
| 2 | Pensées non spécifiques | Pensées de se faire du mal ou de se tuer |
| 3 | Idéation avec méthode | Pensées à la façon de se tuer (sans plan, sans intention) |
| 4 | Idéation avec intention | Pensées suicidaires + certaine intention de passer à l'acte |
| 5 | Idéation avec plan et intention | Plan précis + intention d'agir |

### Section B — Comportements suicidaires (5 items)
Période de référence : **vie entière**.
Réponses : Oui / Non.

| Item | Type | Description |
|------|------|-------------|
| 6 | Tentative avortée | Commencé à se préparer, puis arrêté avant l'acte |
| 7 | Tentative interrompue | Quelqu'un/quelque chose a empêché le passage à l'acte |
| 8 | Actes préparatoires | Préparatifs concrets (médicaments, arme, lettre…) |
| 9 | Tentative de suicide | Tentative réelle |
| 10 | Automutilation non suicidaire | Blessure intentionnelle sans intention de mourir |

> **Note clinique :** L'item 10 est une catégorie distincte des comportements suicidaires. L'automutilation sans intention de mourir ne doit pas être confondue avec une tentative de suicide.

## Scores calculés

| Indicateur | Calcul | Plage |
|------------|--------|-------|
| `ideation_level` | Niveau le plus élevé endorsé (indice 1-5 du dernier item "Oui") | 0–5 |
| `behavior_count` | Somme des items comportements endorsés (items 6–10) | 0–5 |

Ces valeurs sont **brutes**, sans seuil ni interprétation algorithmique — conformité MDR 2017/745. L'interprétation clinique appartient exclusivement au praticien.

## Conformité MDR 2017/745

- ✅ L'application **affiche** uniquement des valeurs brutes (Oui/Non, comptes)
- ✅ Aucun seuil ne déclenche une action ou une alerte
- ✅ Aucun label interprétatif ("élevé", "critique", etc.) n'est affiché
- ✅ La ressource 3114 est affichée de façon **permanente et statique** (non conditionnelle aux réponses)
- ✅ L'interprétation appartient exclusivement au praticien

## Différences vs C-SSRS clinique standard

1. **Mode d'administration** : Hétéro-évaluation en clinique → Auto-évaluation dans l'app (entre séances)
2. **Skip logic omise** : Le protocole standard prévoit de sauter aux comportements si items 1 ET 2 = Non. Omis dans Kær pour simplicité et complétude des données.
3. **Items d'intensité absents** : La version Screen n'inclut pas les items d'intensité (fréquence, durée, contrôlabilité, raison). Cohérent avec la version Screen standard.

## Implémentation technique

### Fichiers

| Fichier | Rôle |
|---------|------|
| `apps/mobile/src/data/cssrs_screen.ts` | Items, options, fonctions de score |
| `apps/mobile/src/data/cssrs_screen.test.ts` | Tests unitaires Jest |
| `apps/mobile/src/screens/modules/CSSRSScreenScreen.tsx` | Écran historique |
| `apps/mobile/src/screens/modules/CSSRSScreenEntryScreen.tsx` | Écran de saisie |
| `apps/mobile/src/lib/database.ts` | Table SQLite `cssrs_screen_entries` + CRUD |
| `apps/web/src/data/scales.ts` | Entrée Dispensaire Clinique |
| `apps/web/src/lib/database.types.ts` | `ModuleType` + labels |
| `apps/mobile/src/theme/teen.ts` | Couleur mode ado (#0EA5E9) |

### Clé de module

`cssrs_screen`

### Structure de la table SQLite

```sql
CREATE TABLE IF NOT EXISTS cssrs_screen_entries (
  id TEXT PRIMARY KEY,
  answers TEXT NOT NULL,         -- JSON : [0-4] idéation, [5-9] comportements (0/1)
  ideation_level INTEGER NOT NULL DEFAULT 0,  -- niveau 0–5
  behavior_count INTEGER NOT NULL DEFAULT 0,  -- somme 0–5
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Navigation

- `CSSRSScreen` → `CSSRSScreenScreen`
- `CSSRSScreenEntry` → `CSSRSScreenEntryScreen`
