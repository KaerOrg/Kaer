# Modules thérapeutiques — Documentation

## Liste des modules

| Clé | Nom | Statut |
|-----|-----|--------|
| `sleep_diary` | Agenda du sommeil | **MVP — disponible** |
| `beck_columns` | Colonnes de Beck (TCC) | Prévu |/
| `fear_thermometer` | Thermomètre de la peur | Prévu |
| `emotion_wheel` | Roue des émotions | Prévu |
| `crisis_plan` | Plan de crise | Prévu |
| `rim` | RIM — Imagerie mentale | Prévu |
| `cognitive_saturation` | Saturation cognitive | Prévu |

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
