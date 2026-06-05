# SNAP-IV — Module Kær

## Description clinique

Le **SNAP-IV** (Swanson, Nolan and Pelham Rating Scale, version IV) est une grille comportementale standardisée de dépistage du Trouble Déficit de l'Attention avec ou sans Hyperactivité (TDAH) chez l'enfant et l'adolescent (6–18 ans).

Il mesure 26 comportements issus des critères diagnostiques DSM-IV répartis en trois sous-échelles :

| Sous-échelle | Items | Score max |
|---|---|---|
| **Inattention (I)** | 1–9 | 27 |
| **Hyperactivité-Impulsivité (H/I)** | 10–18 | 27 |
| **Opposition-Défiance (TOD)** | 19–26 | 24 |
| **Total** | 1–26 | **78** |

**Cotation :** 0 = Pas du tout · 1 = Un peu · 2 = Assez souvent · 3 = Beaucoup

> ⚠️ **Hétéro-évaluation obligatoire.** Ce questionnaire doit être complété par un **parent, un tuteur légal ou un enseignant** — pas par l'enfant lui-même. L'app affiche un avertissement visible à l'écran de saisie.

## Références

- Swanson JM et al. *Clinical relevance of the primary findings of the MTA.* J Am Acad Child Adolesc Psychiatry, 2001.
- CADDRA — *Lignes directrices canadiennes pour le TDAH*, 4e édition (2023). [caddra.ca](https://www.caddra.ca)
- Version francophone : traduction CADDRA (2011).

## Conformité MDR 2017/745

Le module **affiche uniquement les scores bruts** (I, H/I, TOD, total). Aucune étiquette interprétative (ex. « seuil clinique », « TDAH probable »), aucune couleur conditionnelle, aucune alerte automatique. L'interprétation appartient exclusivement au praticien.

## Architecture technique

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/data/snapiv.ts` | 26 items, options 0-3, `computeSNAPIVSubscaleScores()` |
| `apps/mobile/src/data/snapiv.test.ts` | 11 tests unitaires (items, cotation, scores) |
| `apps/mobile/src/screens/modules/SNAPIVScreen.tsx` | Historique + chips I/H·I/TOD |
| `apps/mobile/src/screens/modules/SNAPIVEntryScreen.tsx` | Saisie 26 questions avec séparateurs de section |
| `apps/mobile/src/screens/modules/SNAPIVScreen.test.tsx` | Tests écran liste (navigation, suppression, affichage) |
| `apps/mobile/src/screens/modules/SNAPIVEntryScreen.test.tsx` | Tests écran saisie (validation, scores, compteur) |
| `apps/mobile/src/lib/database.ts` | Table `snapiv_entries`, `SNAPIVEntry`, CRUD |
| `apps/mobile/src/navigation/AppStack.tsx` | Routes `SNAPIV` + `SNAPIVEntry` |
| `apps/mobile/src/screens/HomeScreen.tsx` | `MODULE_CONFIG` + `SCALES_TYPES` |
| `apps/mobile/src/theme/teen.ts` | Couleur turquoise `#0EA5E9` (groupe Échelles) |
| `apps/web/src/lib/database.types.ts` | `ModuleType` + `MODULE_LABELS` + `MODULE_DESCRIPTIONS` |
| `apps/web/src/data/scales.ts` | `CLINICAL_SCALES` — catégorie `Neurodev` |

## Schéma SQLite

```sql
CREATE TABLE IF NOT EXISTS snapiv_entries (
  id TEXT PRIMARY KEY,
  answers TEXT NOT NULL,          -- JSON [0-3, ×26]
  subscale_scores TEXT NOT NULL,  -- JSON { inattention, hyperactivite, tod }
  total_score INTEGER NOT NULL,   -- 0-78
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Affichage dans l'app mobile

- **Écran liste** : carte par passation avec score total /78 + trois chips compactes I/H·I/TOD
- **Écran saisie** : 26 questions groupées en 3 sections visuelles, avertissement hétéro-évaluation jaune en haut, bouton de validation grisé tant que toutes les questions ne sont pas répondues
- **Mode ado** : accent turquoise `#0EA5E9`, même palette que les autres échelles

## Intégration praticien (web)

Le praticien débloque le module depuis la fiche patient → catégorie **Neurodéveloppement** dans l'armoire thérapeutique. Le module apparaît dans le dispensaire clinique avec la fiche de référence CADDRA.
