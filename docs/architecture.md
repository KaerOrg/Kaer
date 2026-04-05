# Architecture technique — PsyTool

## Vue d'ensemble

PsyTool est une application thérapeutique en deux parties communiquant via Supabase (backend as a service).

```
┌─────────────────────────┐         ┌──────────────────────────┐
│   Interface Praticien   │         │    App Patient (mobile)  │
│   (React + Vite)        │         │    (React Native + Expo)  │
│   Navigateur web        │         │    iOS / Android          │
└────────────┬────────────┘         └────────────┬─────────────┘
             │                                    │
             │         HTTPS / REST               │
             └──────────────┬─────────────────────┘
                            │
                 ┌──────────▼──────────┐
                 │      Supabase       │
                 │  PostgreSQL + Auth  │
                 │  REST API + RLS     │
                 └─────────────────────┘
```

## Monorepo npm workspaces

```
PsyTool/
├── apps/
│   ├── web/          # Interface praticien
│   └── mobile/       # App patient
├── packages/
│   └── shared/       # Types TypeScript partagés
├── supabase/
│   └── schema.sql    # Schéma BDD (source de vérité)
├── docs/             # Documentation technique
├── README.md
└── CLAUDE.md
```

Chaque workspace est un package npm indépendant. Les dépendances communes (ex: `@supabase/supabase-js`, `zustand`) sont installées séparément dans chaque app.

## Séparation des rôles

| Rôle | Interface | Authentification |
|------|-----------|-----------------|
| Praticien | Web (navigateur) | Email + mot de passe Supabase |
| Patient | Mobile (iOS/Android) | Email + mot de passe Supabase (via invitation) |

Les deux rôles utilisent le même système d'auth Supabase, distingués par `raw_user_meta_data.role` ('practitioner' ou 'patient').

## Flux de données

### Données serveur (Supabase)
- Profils praticiens et patients
- Relations praticien ↔ patient
- Invitations
- Modules débloqués par patient (type + config JSON)

### Données locales (appareil patient)
- Entrées agenda du sommeil → SQLite via `expo-sqlite`
- Tokens d'authentification → chiffrés via `expo-secure-store`
- Préférences (heure de notification) → `AsyncStorage`

**Principe privacy-first** : aucune donnée clinique sur le serveur par défaut. Le patient contrôle le partage.

## Gestion d'état

Les deux apps utilisent **Zustand** pour l'état d'authentification global.

### Web (`apps/web/src/store/authStore.ts`)
- État: `practitioner | null`, `loading`, `error`
- Actions: `login`, `register`, `updateProfile`, `logout`, `loadSession`

### Mobile (`apps/mobile/src/store/authStore.ts`)
- État: `patient | null`, `loading`
- Actions: `login`, `register` (avec token d'invitation), `logout`, `loadSession`

## Sécurité

### Row Level Security (RLS)
Toutes les tables Supabase ont RLS activé. Chaque ligne n'est accessible qu'à son propriétaire légitime (voir `docs/database.md` pour le détail des policies).

### Tokens d'invitation
- UUID v4, stocké en BDD, expire après 48h
- Un token ne peut être utilisé qu'une seule fois (`accepted_at` marqué)
- Lien envoyé: `/register?token=<uuid>` (web) ou `psytool://invite?token=<uuid>` (deep link mobile)

### Authentification mobile
Les tokens JWT Supabase sont stockés dans `SecureStore` (keychain iOS / keystore Android), jamais en clair.

## Stack technique complète

| Couche | Technologie | Version |
|--------|-------------|---------|
| Backend | Supabase (PostgreSQL + Auth) | Cloud |
| Web | React + TypeScript + Vite | 19 / 5.9 / 5 |
| Mobile | React Native + Expo + TypeScript | 0.81 / 54 / 5.9 |
| Routing web | React Router | 7 |
| Navigation mobile | React Navigation (stack + tabs) | 7 |
| État | Zustand | 5 |
| Stockage local | expo-sqlite + AsyncStorage | – |
| Tokens sécurisés | expo-secure-store | 55 |
| Notifications | expo-notifications | 0.32 |
| Icons web | lucide-react | 1.7 |
| Icons mobile | @expo/vector-icons (Ionicons) | – |

## Lancer le projet

```bash
# Depuis la racine
npm install

# App web praticien
npm run web       # → http://localhost:5173

# App mobile patient
npm run mobile    # → QR code pour Expo Go
```

Voir `README.md` pour la configuration des variables d'environnement.
