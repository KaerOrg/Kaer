# NSI — Nightmare Severity Index (Index de sévérité des cauchemars)

## Référence

Geoffroy PA et al. *The nightmare severity index (NSI): A short new multidimensional tool for assessing nightmares.* J Sleep Res, 2023.  
Licence : CC BY-NC

## Description clinique

| Propriété | Valeur |
|---|---|
| Population | Adultes (18+) |
| Fenêtre temporelle | Dernier mois |
| Nombre d'items scorés | 9 (items 1–9) |
| Échelle de réponse | 0–5 par item |
| Score total | 0–45 |
| Items contextuels | 2 (items 10–11, non scorés) |
| Durée de passation | ~5 min |

## Structure des items

### Items scorés (1–9)

| # | Dimension | Options |
|---|---|---|
| 1 | Fréquence des réveils | ≤1×/mois · >1×/mois · 1×/sem. · >1×/sem. · 1×/nuit · >1×/nuit |
| 2 | Intensité émotionnelle | 0 (très faible) → 5 (très forte) |
| 3 | Fréquence des menaces vitales | ≤1×/mois · >1×/mois · 1×/sem. · >1×/sem. · 1×/nuit · >1×/nuit |
| 4 | Impact sur le fonctionnement global | 0 (aucun) → 5 (très perturbant) |
| 5 | Impact sur l'humeur | 0 (aucun) → 5 (très perturbant) |
| 6 | Impact sur la concentration/mémoire | 0 (aucun) → 5 (très perturbant) |
| 7 | Impact sur l'éveil (somnolence) | 0 (aucun) → 5 (très perturbant) |
| 8 | Perturbation de l'endormissement | 0 (aucun) → 5 (très perturbant) |
| 9 | Perturbation de la continuité du sommeil | 0 (aucun) → 5 (très perturbant) |

**Score total = somme des items 1–9 (0–45)**

### Items contextuels (non scorés)

| # | Description | Stockage |
|---|---|---|
| 10 | % de cauchemars récurrents | `recurrent_pct: number \| null` |
| 11 | Thème(s) récurrent(s) (jusqu'à 3) | `themes: string[]` |

## Implémentation

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/data/nsi.ts` | Items, options, calcul du score |
| `apps/mobile/src/data/nsi.test.ts` | Tests unitaires (données + scoring) |
| `apps/mobile/src/screens/modules/NSIScreen.tsx` | Écran historique (liste des passations) |
| `apps/mobile/src/screens/modules/NSIEntryScreen.tsx` | Écran de saisie |
| `apps/mobile/src/screens/modules/NSIScreen.test.tsx` | Tests de l'écran historique |
| `apps/mobile/src/screens/modules/NSIEntryScreen.test.tsx` | Tests de l'écran de saisie |
| `apps/mobile/src/lib/database.ts` | Table SQLite `nsi_entries` + CRUD |
| `apps/web/src/data/scales.ts` | Entrée NSI dans `CLINICAL_SCALES` |

## Particularités d'implémentation

### Options hétérogènes par item

Contrairement aux autres échelles (options identiques pour tous les items), le NSI a deux types d'items :

- **Items 1 et 3** (fréquence) : 6 options avec labels textuels (≤1×/mois … >1×/nuit)
- **Items 2, 4–9** (intensité/impact) : 6 boutons numériques (0–5) avec ancres affichées en dessous

L'interface `NSIItem` inclut un champ optionnel `anchors?: { left, right }` qui déclenche l'affichage des labels extrêmes sous les boutons.

### Schema SQLite

```sql
CREATE TABLE IF NOT EXISTS nsi_entries (
  id TEXT PRIMARY KEY,
  answers TEXT NOT NULL,        -- JSON : 9 valeurs 0-5
  score INTEGER NOT NULL,       -- somme items 1-9 (0-45)
  recurrent_pct INTEGER,        -- item 10 : 0-100 ou NULL
  themes TEXT NOT NULL DEFAULT '[]',  -- JSON : tableau de strings
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Conformité MDR 2017/745

Le NSI est implémenté en mode **affichage passif** :
- Le score brut (0–45) est affiché sans label ni couleur interprétative
- Aucun seuil ne déclenche une action ou une alerte
- Les items 10–11 sont des champs libres : c'est le patient qui saisit, l'interprétation appartient au praticien
- L'affichage du `%` récurrents est purement informatif, sans comparaison à une norme
