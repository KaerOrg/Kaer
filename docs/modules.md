# Modules thérapeutiques — Documentation

## Liste des modules

> Convention : un fichier de doc par module dans [`modules/`](modules/), nommé d'après la clé `ModuleType` (snake_case).

### Modules thérapeutiques (interactifs)

| Clé | Nom | Statut | Doc |
|-----|-----|--------|-----|
| `sleep_diary` | Agenda du sommeil | **Implémenté** — SQLite local, vue 14 nuits, bilan mensuel | — |
| `beck_columns` | Colonnes de Beck (TCC) | **Implémenté** — SQLite local, 7 colonnes, tests | [doc](modules/beck_columns.md) |
| `fear_thermometer` | Thermomètre de la peur | **Implémenté** — SUDs 0–100, situations, SQLite, tests | [doc](modules/fear_thermometer.md) |
| `emotion_wheel` | Roue des émotions | **Implémenté** — taxonomie Plutchik, 3 niveaux, SQLite, 22 tests | [doc](modules/emotion_wheel.md) |
| `crisis_plan` | Plan de crise | **Implémenté** — protocole Stanley & Brown (2012), 6 étapes, SQLite | — |
| `rim` | RIM — Imagerie mentale | **Implémenté** — IRT Krakow & Zadra (2006), scénario praticien, tests | [doc](modules/rim.md) |
| `cognitive_saturation` | Saturation cognitive | **Implémenté** — défusion ACT, timer 90s, tap counter, SQLite, 22 tests | [doc](modules/cognitive_saturation.md) |
| `grounding` | Ancrage 5-4-3-2-1 | **Implémenté** — DBT Linehan (1993), 5 sens guidés, 17 tests | [doc](modules/grounding.md) |
| `decisional_balance` | Balance décisionnelle | **Implémenté** — grille 2×2, jauge motivation, SQLite, signal Supabase | — |
| `mood_tracker` | Thermomètre de l'humeur | **Implémenté** — humeur/énergie/anxiété/plaisir (1–10), SQLite, graphique | [doc](modules/mood_tracker.md) |
| `medication_adherence` | Observance du traitement | **Implémenté** — SQLite, tests | [doc](modules/medication_adherence.md) |
| `medication_side_effects` | Effets du traitement | **Implémenté** — SQLite, tests | [doc](modules/medication_side_effects.md) |
| `behavioral_activation` | Activation comportementale | **Implémenté** — SQLite, tests | [doc](modules/behavioral_activation.md) |
| `breathing_techniques` | Techniques de respiration | **Implémenté** — 6 techniques, timer guidé, tests | [doc](modules/breathing_techniques.md) |
| `psychoeducation` | Psychoéducation | **Implémenté** — cartes thématiques, lecture, tests | [doc](modules/psychoeducation.md) |
| `exposure_hierarchy` | Hiérarchie d'exposition | À construire | — |
| `craving_journal` | Journal des envies | À construire | — |

### Échelles cliniques (questionnaires)

Pattern générique `ModuleRenderer` — voir [`module-engine.md`](module-engine.md).

| Clé | Nom | Statut | Doc |
|-----|-----|--------|-----|
| `phq9` | PHQ-9 — Dépression | **Implémenté** — 9 items, score 0-27 | — |
| `gad7` | GAD-7 — Anxiété généralisée | **Implémenté** — 7 items, score 0-21 | — |
| `bsl23` | BSL-23 — Symptômes borderline | **Implémenté** — 23 items, score moyen 0-4 | — |
| `rcads` | RCADS-25 — Anxiété & dépression (enfant/ado) | **Implémenté** — 25 items, 6 sous-échelles | — |
| `epds` | EPDS — Dépression post-natale | **Implémenté** | [doc](modules/epds.md) |
| `nsi` | NSI — Inventaire neuropsychologique | **Implémenté** | [doc](modules/nsi.md) |
| `cssrs` | C-SSRS — Dépistage suicidaire | **Implémenté** — écran custom (logique conditionnelle) | [doc](modules/cssrs_screen.md) |
| `snap_iv` | SNAP-IV — TDAH enfant/ado (hétéro-éval) | **Implémenté** — 26 items, 3 sous-échelles | [doc](modules/snap_iv.md) |
| `asrs6` | ASRS v1.1 Dépistage Rapide — TDAH adulte | **Implémenté** — 6 items Kessler (2005) | [doc](modules/asrs6.md) |
| `asrs18` | ASRS v1.1 Bilan Complet — TDAH adulte | **Implémenté** — 18 items (Parties A+B) | [doc](modules/asrs18.md) |

## Module Agenda du sommeil (`sleep_diary`)

### Objectif
Enregistrer les habitudes de sommeil nuit par nuit pour identifier des patterns et suivre les progrès thérapeutiques.

### Données enregistrées (localement sur l'appareil)
- Heure de coucher
- Heure de réveil
- Temps d'endormissement (minutes)
- Nombre de réveils nocturnes
- Qualité subjective (1–5 étoiles)
- Notes libres

### Stockage
SQLite local (`sleep_diary_entries`) — voir `docs/mobile-app.md`. Aucune synchronisation serveur par défaut.

### Écrans concernés
- `SleepDiaryScreen` — vue liste sur 14 nuits
- `SleepDiaryEntryScreen` — formulaire de saisie

### Notifications
Le patient peut activer un rappel quotidien (heure configurable dans ProfileScreen) via `expo-notifications`.

---

## Comment ajouter un nouveau module

### 1. Déclarer le type

Dans `packages/shared/src/index.ts`, ajouter la clé dans `ModuleType`:
```ts
export type ModuleType =
  | 'sleep_diary'
  | 'beck_columns'
  | 'new_module'   // ← ajouter ici
  // ...
```

### 2. Ajouter les labels côté web

Dans `apps/web/src/lib/database.types.ts`:
```ts
export const MODULE_LABELS: Record<ModuleType, string> = {
  // ...
  new_module: 'Nom affiché',
}

export const MODULE_DESCRIPTIONS: Record<ModuleType, string> = {
  // ...
  new_module: 'Description courte pour le praticien.',
}
```

### 3. Créer les écrans côté mobile

Dans `apps/mobile/src/screens/modules/`, créer:
- `NewModuleScreen.tsx` — écran principal
- `NewModuleEntryScreen.tsx` — formulaire si nécessaire

### 4. Enregistrer le module dans la navigation

Dans `apps/mobile/src/navigation/AppStack.tsx`, ajouter les écrans au `Stack.Navigator`:
```tsx
<Stack.Screen name="NewModule" component={NewModuleScreen} />
```

### 5. Rendre le module cliquable dans HomeScreen

Dans `apps/mobile/src/screens/HomeScreen.tsx`, dans la fonction `handleModulePress`:
```ts
case 'new_module':
  navigation.navigate('NewModule')
  break
```

### 6. Créer la base locale si nécessaire

Si le module stocke des données localement, ajouter une table dans `apps/mobile/src/lib/database.ts` avec les fonctions CRUD correspondantes.

### 7. Tester le flux complet
1. Praticien débloque le module dans PatientPage (web)
2. Patient voit le module dans HomeScreen (mobile)
3. Patient accède au module et saisit des données
4. Les données sont stockées localement
