# Roue des émotions (`emotion_wheel`)

## Référence clinique

**Technique** : Identification et labellisation émotionnelle  
**Référence** : Plutchik (1980), *Emotion: A Psychoevolutionary Synthesis* — Roue des émotions à 8 primaires  
**Indications principales** :
- Alexithymie (difficulté à identifier et nommer ses émotions)
- Préparation aux entretiens thérapeutiques
- Psychoéducation émotionnelle (TCC, ACT, TCD)

**Principe** : Guider le patient à travers trois niveaux de précision (émotion primaire → nuance → terme spécifique) pour nommer son vécu émotionnel avec exactitude. Le résultat est enregistré localement et consultable par le patient, sans interprétation algorithmique.

## Architecture

### Stockage des données

SQLite local — table `emotion_entries`.

| Champ | Type | Description |
|---|---|---|
| `id` | TEXT | UUID |
| `primary_key` | TEXT | Clé de l'émotion primaire (ex. `joy`) |
| `primary_label` | TEXT | Label affiché (ex. `Joie`) |
| `secondary_key` | TEXT | Clé de la nuance (ex. `serenity`) |
| `secondary_label` | TEXT | Label de la nuance (ex. `Sérénité`) |
| `specific_key` | TEXT | Clé du terme spécifique (ex. `calm`) |
| `specific_label` | TEXT | Label spécifique (ex. `Calme`) |
| `intensity` | INTEGER | Intensité brute 1–10 (saisie patient) |
| `notes` | TEXT | Note libre optionnelle |
| `created_at` | TEXT | Horodatage ISO 8601 |

### Constante taxonomique

`apps/mobile/src/constants/emotionWheel.ts` — 8 émotions primaires (Plutchik), chacune avec 3 nuances et 3 termes spécifiques, soit 72 termes au total.

## Flux patient (mobile)

### Écran principal (`EmotionWheelScreen`)
- Bouton "Identifier une émotion" → `EmotionEntryScreen`
- Bouton calendrier → `EmotionMonthScreen`
- Historique des entrées avec : émotion primaire colorée, nuance, terme spécifique, intensité brute, date

### Saisie guidée (`EmotionEntryScreen`) — 5 étapes
1. **Émotion primaire** — grille 2×2 des 8 émotions colorées avec icône
2. **Nuance** — liste des 3 nuances de l'émotion choisie
3. **Terme spécifique** — liste des 3 termes de la nuance choisie
4. **Intensité** — sélecteur 1–10 (valeur brute, sans label interprétatif)
5. **Note libre** — champ texte optionnel + récapitulatif

### Bilan mensuel (`EmotionMonthScreen`)
- Vue par mois des entrées, regroupées par émotion primaire

## Conformité MDR 2017/745

- L'intensité (1–10) est affichée brute, sans label ("faible / fort / sévère")
- Aucune couleur ou icône interprétative selon l'intensité
- Aucune tendance calculée ni comparaison à une norme
- Les données restent sur l'appareil du patient par défaut

## Navigation mobile

```
AppStack → EmotionWheel (EmotionWheelScreen)
         → EmotionEntry (EmotionEntryScreen)
         → EmotionMonth (EmotionMonthScreen)
```

Module type : `emotion_wheel`  
Écrans : `apps/mobile/src/screens/modules/EmotionWheelScreen.tsx`, `EmotionEntryScreen.tsx`, `EmotionMonthScreen.tsx`  
Tests : `apps/mobile/src/screens/modules/EmotionWheelScreen.test.tsx` (22 tests)
