# RIM — Retraitement par l'Imagerie Mentale

## Référence clinique

**Technique** : Image Rehearsal Therapy (IRT) — Krakow & Zadra, 2006  
**Niveau de preuve** : Grade A (méta-analyse Casement & Swanson, 2012, *Sleep Medicine Reviews*)  
**Indications principales** :
- Trouble de Stress Post-Traumatique (TSPT) avec cauchemars récurrents
- Cauchemars dans le cadre d'une idéation suicidaire pré-suicidaire

**Principe** : Le patient rédige avec son praticien un scénario alternatif positif au cauchemar récurrent, puis le répète mentalement chaque soir avant le coucher. La répétition de l'imagerie mentale positive entraîne progressivement le remplacement du contenu onirique négatif.

## Architecture

### Stockage des données

- Les scénarios sont stockés dans `patient_modules.config` (Supabase) — côté serveur.
- Aucune donnée n'est stockée localement (pas de SQLite/MMKV pour ce module).
- Le praticien rédige les scénarios dans l'interface web ; le patient les consulte en lecture seule.

```json
{
  "alternative_scenario": "Je me retrouve dans un pré verdoyant...",
  "original_scenario": "Le couloir sombre et angoissant."
}
```

### Champs

| Champ | Obligatoire | Description |
|---|---|---|
| `alternative_scenario` | ✅ | Scénario positif de substitution, rédigé par le praticien |
| `original_scenario` | ❌ | Cauchemar initial, pour référence — jamais affiché en premier |

## Flux praticien (web)

1. Ouvrir la page du patient → Armoire thérapeutique → Restructuration Cognitive
2. Cliquer **Débloquer** sur la carte RIM
3. Rédiger le scénario alternatif (obligatoire) et optionnellement le scénario initial
4. Cliquer **Débloquer avec ce scénario**

Le praticien peut modifier les scénarios à tout moment via **Modifier le scénario**.

## Flux patient (mobile)

L'écran `RimScreen.tsx` affiche :
1. **Avertissement** — utilisation exclusivement avec un professionnel formé
2. **Scénario alternatif** — texte configuré par le praticien, carte bordée à gauche
3. **Consignes de pratique** — 5 étapes IRT (Krakow & Zadra 2006)
4. **Scénario initial** (optionnel) — masqué par défaut, toggle au tap
5. **Sons d'ambiance** — 5 boutons (Pluie douce, Vagues, Forêt, Vent doux, Ruisseau) — UI prête, audio disponible prochainement avec `expo-audio`
6. **Section urgence** — 3114 (prévention suicide) et 15 (SAMU)

## Conformité MDR 2017/745

- Aucun score, seuil ou label interprétatif généré par l'application
- L'application affiche uniquement le texte saisi par le praticien
- Aucune alerte conditionnelle aux données saisies
- Interprétation clinique = responsabilité exclusive du praticien

## Navigation mobile

```
AppStack → Rim (RimScreen)
```

Module_type : `rim`  
Écran : `apps/mobile/src/screens/modules/RimScreen.tsx`  
Tests : `apps/mobile/src/screens/modules/RimScreen.test.tsx` (15 tests)

## Activer l'audio (future version)

```bash
npx expo install expo-audio
```

Puis implémenter `useAudioPlayer` dans `RimScreen.tsx` — les boutons sont déjà câblés,
il suffit de basculer `available: true` dans `AMBIENT_SOUNDS` et d'implémenter la lecture.
