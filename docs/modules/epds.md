# EPDS — Edinburgh Postnatal Depression Scale

## Référence

Cox, J.L., Holden, J.M., & Sagovsky, R. (1987). Detection of postnatal depression. Development of the 10-item Edinburgh Postnatal Depression Scale. *British Journal of Psychiatry*, 150, 782–786.

© The Royal College of Psychiatrists 1987. Reproduction autorisée à des fins cliniques non commerciales.

## Description clinique

L'EPDS est une échelle de dépistage auto-administrée de 10 items, conçue pour détecter la dépression périnatale (ante et post-partum). Recommandée par la HAS dans le cadre de l'entretien postnatal précoce obligatoire (arrêté juillet 2022).

- **Population cible** : femmes enceintes ou ayant récemment accouché
- **Fenêtre temporelle** : 7 derniers jours
- **Score total** : 0 à 30 (somme des 10 items)
- **Durée de passation** : 3–5 minutes

## Scoring

Chaque item est côté de 0 à 3. Certains items ont un scoring normal (0-1-2-3) et d'autres un scoring inversé (3-2-1-0) selon la formulation.

| Items | Sens du scoring |
|---|---|
| 1, 2, 4 | Normal : première option = 0, dernière = 3 |
| 3, 5, 6, 7, 8, 9, 10 | Inversé : première option = 3, dernière = 0 |

**Score total = somme des valeurs des 10 réponses (0 – 30).**

Le score est un chiffre brut transmis au praticien. **Aucune interprétation algorithmique n'est réalisée par l'application** (conformité MDR 2017/745 — non-dispositif médical).

## Implémentation

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/data/epds.ts` | Items, options par item, `computeEPDSScore()` |
| `apps/mobile/src/data/epds.test.ts` | Tests unitaires (structure + calcul de score) |
| `apps/mobile/src/screens/modules/EPDSScreen.tsx` | Historique des passations |
| `apps/mobile/src/screens/modules/EPDSEntryScreen.tsx` | Saisie (options verticales, textes par item) |
| `apps/mobile/src/screens/modules/EPDSScreen.test.tsx` | Tests écran historique |
| `apps/mobile/src/screens/modules/EPDSEntryScreen.test.tsx` | Tests écran saisie |
| `apps/mobile/src/lib/database.ts` | Table SQLite `epds_entries`, CRUD |

### Particularité : options verticales

Contrairement aux autres échelles (PHQ-9, GAD-7, BSL-23) dont les 4 options sont identiques et affichées horizontalement, chaque item de l'EPDS possède ses propres libellés de réponse (certains très longs, notamment l'item 6). Les options sont donc affichées **verticalement** avec un indicateur radio circulaire, pour une lisibilité optimale.

### SQLite

Table `epds_entries` :

```sql
CREATE TABLE IF NOT EXISTS epds_entries (
  id TEXT PRIMARY KEY,
  answers TEXT NOT NULL,      -- JSON : tableau de 10 entiers 0-3
  score INTEGER NOT NULL,     -- somme 0-30
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Conformité MDR 2017/745

- Le score est calculé et affiché comme chiffre brut uniquement.
- Aucun seuil ne déclenche d'alerte ou de message interprétatif.
- L'item 10 (pensées d'automutilation) est traité comme les autres — aucune alerte conditionnelle.
- Le praticien reçoit le score brut et en fait l'interprétation clinique en consultation.
