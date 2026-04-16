# Saturation cognitive (`cognitive_saturation`)

## Référence clinique

**Technique** : Saturation sémantique / défusion cognitive  
**Référence** : Hayes, Strosahl & Wilson (1999), *Acceptance and Commitment Therapy* — techniques de défusion ; Titchener (1916) — saturation sémantique  
**Niveau de preuve** : Utilisé en ACT, TCC et TCD pour la défusion cognitive  
**Indications principales** :
- Ruminations intrusives
- Fusion cognitive (le patient s'identifie à ses pensées négatives)
- Pensées automatiques envahissantes

**Principe** : Répéter un mot ou une pensée brève de manière rapide et répétée jusqu'à ce qu'il perde sa charge émotionnelle et devienne "juste des sons". L'effet de saturation sémantique crée une distance entre le patient et sa pensée (défusion).

## Architecture

### Stockage des données

SQLite local — table `cognitive_saturation_sessions`.

| Champ | Type | Description |
|---|---|---|
| `id` | TEXT | UUID |
| `word` | TEXT | Mot ou pensée travaillée (max 40 caractères) |
| `repetitions` | INTEGER | Nombre de tapotements enregistrés |
| `duration_seconds` | INTEGER | Durée effective de l'exercice en secondes |
| `created_at` | TEXT | Horodatage ISO 8601 |

## Flux patient (mobile)

### Écran principal (`CognitiveSaturationScreen`)
- Bouton "Démarrer un exercice" → `CognitiveSaturationExerciseScreen`
- Historique des sessions : mot travaillé, nombre de répétitions, durée, date

### Exercice (`CognitiveSaturationExerciseScreen`) — 3 modes

#### Mode saisie
- Champ texte pour entrer le mot ou la pensée (max 40 caractères)
- Explication de la technique (instructions en 3 étapes)
- Bouton "Démarrer l'exercice" (désactivé si champ vide)

#### Mode exercice
- Timer décompte de 90 secondes avec barre de progression
- Compteur de répétitions (grand affichage)
- Zone de tap centrale affichant le mot en grand — le patient appuie à chaque répétition
- Vibration haptique à chaque tap
- Bouton "Terminer" pour arrêter avant la fin du timer

#### Mode terminé
- Récapitulatif brut : mot travaillé, nombre de répétitions, durée
- Bouton "Enregistrer et terminer" — sauvegarde la session et retour à l'historique
- Bouton "Recommencer" — relance avec un nouveau mot

## Conformité MDR 2017/745

- Les statistiques (répétitions, durée) sont des chiffres bruts sans label interprétatif
- Aucun message du type "vous avez réussi à vous détacher de cette pensée"
- Aucune comparaison à une norme ou une session précédente
- Aucune alerte conditionnelle aux données saisies

## Navigation mobile

```
AppStack → CognitiveSaturation (CognitiveSaturationScreen)
         → CognitiveSaturationExercise (CognitiveSaturationExerciseScreen)
```

Module type : `cognitive_saturation`  
Écrans : `apps/mobile/src/screens/modules/CognitiveSaturationScreen.tsx`, `CognitiveSaturationExerciseScreen.tsx`  
Tests : `apps/mobile/src/screens/modules/CognitiveSaturationScreen.test.tsx` (22 tests)
