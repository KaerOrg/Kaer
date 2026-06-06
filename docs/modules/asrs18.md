# ASRS v1.1 — Bilan Complet (18 items)

## Présentation

L'**Adult ADHD Self-Report Scale v1.1 Full Assessment** (ASRS-18) est la version complète de l'échelle ASRS v1.1, développée par Ronald Kessler pour l'Organisation Mondiale de la Santé. Elle comprend les 18 items des Parties A et B, pour un bilan approfondi du TDAH chez l'adulte (18 ans et plus).

**Référence de validation :**
Kessler RC, Adler L, Ament M, et al. *The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population.* Psychological Medicine 2005;35(2):245–256.
→ https://pubmed.ncbi.nlm.nih.gov/15841682/

## Structure

| Partie | Items | Score |
|--------|-------|-------|
| Partie A | 1 – 6 | 0 – 24 |
| Partie B | 7 – 18 | 0 – 48 |
| **Total** | **18** | **0 – 72** |

## Cotation

- 18 items cotés sur une échelle de fréquence à 5 niveaux : Jamais (0) / Rarement (1) / Parfois (2) / Souvent (3) / Très souvent (4)
- L'interprétation appartient exclusivement au praticien

## Conformité MDR (règle d'or Kær)

L'ASRS v1.1 possède des seuils de dépistage publiés. **Kær n'implémente aucun de ces seuils.** Le code affiche uniquement les scores bruts (Partie A, Partie B, total). L'interprétation appartient exclusivement au praticien lors de la consultation.

## Clé de module

`asrs18`

## Fichiers

| Fichier | Rôle |
|---------|------|
| `apps/mobile/src/data/asrs18.ts` | 18 items, `ASRS18_PARTS`, `computeASRS18SubScores()` |
| `apps/mobile/src/data/asrs18.test.ts` | Tests unitaires (répartition, scoring, edge cases) |
| `apps/mobile/src/screens/modules/ASRS18Screen.tsx` | Historique des passations, chips Partie A / B, bouton info PubMed |
| `apps/mobile/src/screens/modules/ASRS18EntryScreen.tsx` | Saisie des 18 réponses avec séparateurs de section |
| `apps/mobile/src/screens/modules/ASRS18Screen.test.tsx` | Tests d'écran (navigation, chips, suppression, conformité MDR) |
| `apps/mobile/src/screens/modules/ASRS18EntryScreen.test.tsx` | Tests d'écran (validation, sous-scores, sauvegarde) |
| `apps/mobile/src/lib/database.ts` | Table `asrs18_entries` (SQLite), CRUD |

## Population cible

- Adultes 18 ans et plus
- Auto-évaluation (rempli par le patient lui-même)

## Différence avec ASRS v1.1 Dépistage (`asrs6`)

| | ASRS-6 (`asrs6`) | ASRS-18 (`asrs18`) |
|---|---|---|
| Items | Partie A uniquement | Parties A + B |
| Score | 0–24 | 0–72 (+ sous-scores A/B) |
| Usage | Dépistage rapide | Bilan approfondi |
| Durée | ~2 min | ~5 min |
