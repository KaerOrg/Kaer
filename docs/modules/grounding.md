# Ancrage 5-4-3-2-1 (`grounding`)

## Référence clinique

**Technique** : Grounding sensoriel 5-4-3-2-1  
**Référence** : Linehan (1993), *DBT Skills Training Manual* — Techniques de tolérance à la détresse  
**Niveau de preuve** : Grade B (consensus clinique HAS, NICE — recommandations troubles anxieux)  
**Indications principales** :
- États dissociatifs
- Crises d'angoisse aiguë
- Ruminations envahissantes
- Flashbacks (TSPT)

**Principe** : Guider l'attention vers les cinq sens de manière séquentielle (5 choses vues, 4 touchées, 3 entendues, 2 odeurs, 1 goût) pour ancrer le patient dans le moment présent et interrompre la spirale dissociative ou anxieuse.

## Architecture

### Stockage des données

Aucune donnée stockée — exercice purement interactif, sans historique.

### Modes d'affichage

| Mode | Description |
|---|---|
| `intro` | Présentation de la technique, aperçu des 5 étapes, bouton Démarrer |
| `guided` | Une étape à la fois avec barre de progression, instruction et exemple |
| `done` | Écran de fin neutre, bouton Recommencer |

## Flux patient (mobile)

1. **Intro** — description de la technique, aperçu visuel des 5 sens, note clinique Grade B
2. **Exercice guidé** — barre de progression, carte colorée par sens, instruction + exemple concret
3. **Fin** — message neutre d'observation ("Prenez un moment pour observer comment vous vous sentez maintenant")

Section urgences visible en mode intro et fin : **3114** (prévention suicide) et **15** (SAMU).

## Conformité MDR 2017/745

- Aucun score, seuil ou mesure générés
- Aucune interprétation algorithmique de l'état du patient
- Contenu éducatif et guidage procédural uniquement
- Numéros d'urgence affichés passivement (non conditionnels aux données)

## Navigation mobile

```
AppStack → Grounding (GroundingScreen)
```

Module type : `grounding`  
Écran : `apps/mobile/src/screens/modules/GroundingScreen.tsx`  
Tests : `apps/mobile/src/screens/modules/GroundingScreen.test.tsx` (17 tests)
