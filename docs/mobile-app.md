# App mobile patient — Documentation

Application React Native (Expo) destinée aux patients. Fonctionne sur iOS et Android.

## Lancer

```bash
npm run mobile   # depuis la racine → QR code pour Expo Go
```

Scanner le QR avec l'app **Expo Go** (iOS App Store / Google Play).

## Structure

```
apps/mobile/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx               # Connexion patient
│   │   ├── RegisterScreen.tsx            # Inscription (avec token)
│   │   ├── HomeScreen.tsx                # Liste des modules débloqués
│   │   ├── ProfileScreen.tsx             # Paramètres, notifications, déconnexion
│   │   └── modules/
│   │       ├── SleepDiaryScreen.tsx      # Liste des nuits (14 jours)
│   │       └── SleepDiaryEntryScreen.tsx # Formulaire d'une nuit
│   ├── navigation/
│   │   ├── index.tsx                     # Root Navigator (Auth vs App)
│   │   ├── AuthStack.tsx                 # Navigation non-connecté
│   │   └── AppStack.tsx                  # Navigation connecté (tabs + stack)
│   ├── components/
│   │   ├── Button.tsx                    # Bouton tactile réutilisable
│   │   └── InputField.tsx                # Champ texte avec label/erreur
│   ├── store/
│   │   └── authStore.ts                  # État auth patient (Zustand)
│   ├── lib/
│   │   ├── supabase.ts                   # Client Supabase (SecureStore)
│   │   ├── database.ts                   # SQLite local (agenda du sommeil)
│   │   └── notifications.ts             # Notifications push locales
│   └── theme/
│       └── index.ts                      # Couleurs, espacements, typographie
├── App.tsx                               # Entrée: StatusBar + Navigation
├── index.ts                              # Entrée Expo
└── app.json                              # Config Expo (nom, icône, etc.)
```

## Navigation

```
Root Navigator
├── AuthStack (si non connecté)
│   ├── LoginScreen
│   └── RegisterScreen
└── AppStack (si connecté)
    ├── Bottom Tabs
    │   ├── HomeScreen (onglet Modules)
    │   └── ProfileScreen (onglet Profil)
    └── Stack Screens
        ├── SleepDiaryScreen
        └── SleepDiaryEntryScreen
```

**Deep linking** configuré pour `psytool://invite?token=<uuid>` → ouvre RegisterScreen avec le token pré-rempli.

Au démarrage (navigation/index.tsx): initialise la base SQLite + les notifications, puis vérifie la session Supabase.

## Écrans

### LoginScreen
- Champs: email, mot de passe
- Bouton connexion → `authStore.login()`
- Bouton "J'ai une invitation" → RegisterScreen

### RegisterScreen
- Champs: code d'invitation (token), email, mot de passe, confirmation
- Validation: mots de passe identiques, 8 caractères minimum
- Étapes dans `authStore.register()`:
  1. Valide le token (non expiré, non déjà utilisé)
  2. Crée le compte Supabase Auth
  3. Crée le profil dans `patients`
  4. Marque l'invitation comme acceptée
  5. Crée la relation `practitioner_patients`

### HomeScreen
- Liste des modules débloqués via `patient_modules` (Supabase)
- Pull-to-refresh
- Recharge à chaque focus d'écran (`useFocusEffect`)
- Carte par module: icône, nom, description
  - Badge "Bientôt disponible" si non implémenté
  - Chevron si cliquable
- État vide: message d'instructions
- Seul `sleep_diary` est actuellement cliquable

### ProfileScreen
- Email du compte affiché
- **Notifications**: toggle rappel agenda du sommeil + heure (DateTimePicker)
- **Confidentialité**: toggle partage données avec praticien (UI uniquement, pas encore implémenté)
- **Déconnexion**: avec alerte de confirmation

### SleepDiaryScreen
- Affiche les 14 dernières nuits (YYYY-MM-DD, plus récent en premier)
- CTA "Saisir la nuit dernière" → SleepDiaryEntryScreen pour hier
- Chaque ligne: point vert (saisie existante) / gris (vide), date, heures, durée, étoiles de qualité
- Appui sur une ligne → SleepDiaryEntryScreen pour cette date

### SleepDiaryEntryScreen
- Paramètre: `date` (YYYY-MM-DD)
- Champs:
  - Heure de coucher (TimePicker)
  - Heure de réveil (TimePicker)
  - Temps d'endormissement en minutes (compteur 0–120)
  - Nombre de réveils nocturnes (compteur 0–20)
  - Qualité subjective (étoiles 1–5)
  - Notes libres (optionnel)
- Pré-remplit les données si une entrée existe pour cette date
- Bouton Enregistrer → INSERT OR REPLACE dans SQLite
- Bouton Supprimer (si entrée existante)

## Base de données locale (SQLite)

Gérée dans `lib/database.ts`. Fichier SQLite créé automatiquement au premier lancement.

### Table `sleep_diary_entries`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | text PK | ID aléatoire |
| `date` | text UNIQUE | Format YYYY-MM-DD |
| `bedtime` | text | Format HH:MM |
| `wake_time` | text | Format HH:MM |
| `sleep_onset_minutes` | integer | Minutes pour s'endormir |
| `awakenings` | integer | Nombre de réveils |
| `quality` | integer | Étoiles (1–5) |
| `notes` | text | Notes libres |
| `created_at` | text | Timestamp ISO |

### Fonctions utilitaires

```ts
initDatabase()                          // Crée la table si elle n'existe pas
getAllSleepEntries()                     // Toutes les entrées, triées par date DESC
getSleepEntry(date: string)             // Entrée pour une date précise
saveSleepEntry(entry: SleepEntry)       // INSERT OR REPLACE
deleteSleepEntry(id: string)            // Supprime une entrée
computeSleepDuration(bedtime, wakeTime, onsetMinutes) // → { hours, minutes }
```

## Notifications locales

Gérées dans `lib/notifications.ts` via `expo-notifications`.

```ts
requestNotificationPermission()                    // Demande la permission
scheduleSleepDiaryReminder(hour: number, minute: number) // Rappel quotidien
cancelSleepDiaryReminder()                         // Annule le rappel
getSleepDiaryReminderTime()                        // → { hour, minute } ou null
```

Un canal Android est créé (`sleep_diary_reminders`) pour les notifications persistantes.

## Thème (`theme/index.ts`)

```ts
colors.primary        // #4F46E5 (indigo)
colors.background     // Fond de l'app
colors.card           // Fond des cartes
colors.text           // Texte principal
colors.textMuted      // Texte secondaire

spacing.xs / sm / md / lg / xl   // 4 / 8 / 16 / 24 / 32 px

radius.sm / md / lg / full       // 6 / 10 / 16 / 999

typography.h1 / h2 / h3 / body / caption  // Presets fontSize + fontWeight
```

## Store auth (`authStore.ts`)

```ts
const { patient, loading, login, register, logout, loadSession } = useAuthStore()
```

| Action | Description |
|--------|-------------|
| `loadSession()` | Restaure la session + écoute les changements d'auth |
| `login(email, password)` | Connexion |
| `register(email, password, token)` | Inscription via invitation |
| `logout()` | Déconnexion |

## Variables d'environnement

Fichier `apps/mobile/.env` à créer:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Le préfixe `EXPO_PUBLIC_` rend les variables accessibles côté client dans Expo.
