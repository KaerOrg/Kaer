# ASRS v1.1 — Dépistage Rapide (6 items)

## Présentation

L'**Adult ADHD Self-Report Scale v1.1 Screener** (ASRS-6) est la Partie A de l'échelle ASRS v1.1, développée par Ronald Kessler pour l'Organisation Mondiale de la Santé. C'est un auto-questionnaire de dépistage du TDAH chez l'adulte (18 ans et plus) composé de 6 items.

**Référence de validation :**
Kessler RC, Adler L, Ament M, et al. *The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population.* Psychological Medicine 2005;35(2):245–256.
→ https://pubmed.ncbi.nlm.nih.gov/15841682/

## Cotation

- 6 items cotés sur une échelle de fréquence à 5 niveaux : Jamais (0) / Rarement (1) / Parfois (2) / Souvent (3) / Très souvent (4)
- **Score total : 0 à 24** (somme des 6 items)
- L'interprétation appartient exclusivement au praticien

## Conformité MDR (règle d'or PsyTool)

L'ASRS-6 possède des seuils de dépistage publiés (items 1–3 ≥ 2, items 4–6 ≥ 3, dépistage positif si ≥ 4 items positifs). **PsyTool n'implémente aucun de ces seuils.** Le code affiche uniquement le score brut (0–24). L'interprétation appartient exclusivement au praticien lors de la consultation.

## Clé de module

`asrs6`

## Fichiers

| Fichier | Rôle |
|---------|------|
| `apps/mobile/src/data/asrs6.ts` | 6 items, options 0–4, `computeASRS6Score()` |
| `apps/mobile/src/data/asrs6.test.ts` | Tests unitaires (6 items, scoring) |
| `apps/mobile/src/screens/modules/ASRS6Screen.tsx` | Historique des passations, bouton info (référence PubMed) |
| `apps/mobile/src/screens/modules/ASRS6EntryScreen.tsx` | Saisie des 6 réponses |
| `apps/mobile/src/screens/modules/ASRS6Screen.test.tsx` | Tests d'écran (navigation, suppression, conformité MDR) |
| `apps/mobile/src/screens/modules/ASRS6EntryScreen.test.tsx` | Tests d'écran (validation, sauvegarde) |
| `apps/mobile/src/lib/database.ts` | Table `asrs6_entries` (SQLite), CRUD |

## Population cible

- Adultes 18 ans et plus
- Auto-évaluation (rempli par le patient lui-même)

## Bouton info (référence)

L'écran d'historique (ASRS6Screen) affiche un bouton `ⓘ` dans le header. Ce bouton ouvre la publication originale Kessler et al. (2005) sur PubMed via `Linking.openURL`.
