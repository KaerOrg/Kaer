# PsyTool

Outil d'accompagnement thérapeutique en deux parties :
- **Interface web praticien** — tableau de bord pour gérer les patients et débloquer des modules
- **App mobile patient** — accès aux outils thérapeutiques débloqués par le praticien

---

## Prérequis

Installe ces outils avant de commencer :

| Outil | Lien | Vérification |
|---|---|---|
| Node.js (v18+) | [nodejs.org](https://nodejs.org) | `node -v` |
| npm (v9+) | inclus avec Node.js | `npm -v` |
| Expo Go (téléphone) | App Store / Play Store | — |
| ngrok (optionnel, dev) | `brew install ngrok` | `ngrok -v` |

---

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/<ton-compte>/PsyTool.git
cd PsyTool
```

### 2. Installer les dépendances

```bash
npm install
```

Cette commande installe les dépendances de toutes les apps en une seule fois (monorepo npm workspaces).

### 3. Configurer les variables d'environnement

#### App web (`apps/web/.env`)

Créer le fichier `apps/web/.env` avec :

```env
VITE_SUPABASE_URL=https://VOTRE_ID_PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=VOTRE_ANON_KEY
```

#### App mobile (`apps/mobile/.env`)

Créer le fichier `apps/mobile/.env` avec :

```env
EXPO_PUBLIC_SUPABASE_URL=https://VOTRE_ID_PROJET.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=VOTRE_ANON_KEY
```

---

## Lancer le projet

Tu auras besoin de **2 terminaux** (3 si tu testes sur téléphone depuis l'extérieur).

### Terminal 1 — App web praticien

```bash
npm run web
```

Ouvre [http://localhost:5173](http://localhost:5173) dans ton navigateur.

### Terminal 2 — App mobile patient

```bash
npm run mobile
```

Scanne le QR code avec **Expo Go** sur ton téléphone.

### Terminal 3 — Tunnel ngrok (optionnel)

Nécessaire uniquement si tu veux qu'un patient accède à l'app depuis son téléphone pendant le développement.

```bash
ngrok http 5173
```

Ngrok génère une URL publique (ex: `https://abc123.ngrok-free.app`). Utilise cette URL à la place de `localhost:5173` lors de l'envoi des invitations.

> **Attention :** l'URL ngrok change à chaque redémarrage (plan gratuit). Il faudra recréer une invitation avec la nouvelle URL.

---

## Structure du projet

```
PsyTool/
├── apps/
│   ├── web/                  # Interface praticien (React + Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── pages/        # Pages de l'app (Dashboard, Patient, Login…)
│   │   │   ├── components/   # Composants réutilisables (Layout, Button…)
│   │   │   ├── store/        # État global (Zustand)
│   │   │   └── lib/          # Client Supabase, types TypeScript
│   │   └── .env              # Variables d'environnement (non commitées)
│   └── mobile/               # App patient (Expo + React Native + TypeScript)
│       └── .env              # Variables d'environnement (non commitées)
├── packages/
│   └── shared/               # Types TypeScript partagés entre web et mobile
├── supabase/
│   └── schema.sql            # Schéma de base de données (source de vérité)
└── README.md
```

---

## Base de données (Supabase)

Le projet utilise **Supabase** (PostgreSQL hébergé) comme backend.

- Projet : `psytool` — région Paris (`eu-west-3`)
- Dashboard : [supabase.com](https://supabase.com)

Le schéma complet est dans `supabase/schema.sql`. Il est idempotent (peut être rejoué sans erreur).

### Tables

| Table | Description |
|---|---|
| `practitioners` | Profils praticiens |
| `patients` | Profils patients |
| `practitioner_patients` | Relation praticien ↔ patient |
| `invitations` | Invitations envoyées par le praticien (token UUID, expire 48h) |
| `patient_modules` | Modules thérapeutiques débloqués par patient |

---

## Flux d'invitation patient

```
1. Praticien → Dashboard → "Inviter un patient" → saisit l'email
2. Un token UUID est généré (valide 48h) et stocké en BDD
3. Un lien est affiché : https://<domaine>/register?token=<uuid>
4. Le praticien envoie ce lien au patient (email automatique via Resend)
5. Le patient ouvre le lien, crée son compte avec un mot de passe
6. Le trigger SQL lie automatiquement le patient au praticien
```

Voir `apps/web/INVITATION_FLOW.md` pour les détails techniques.

---

## Envoi d'emails (Resend)

Les emails d'invitation sont envoyés via [Resend](https://resend.com).

- En mode gratuit sans domaine vérifié : envoi possible uniquement vers votre propre adresse email
- Pour envoyer à n'importe qui : vérifier un domaine sur [resend.com/domains](https://resend.com/domains)

La clé API est utilisée dans la Supabase Edge Function `send-invitation`.

---

## Modules thérapeutiques

| Clé | Nom | Statut |
|---|---|---|
| `sleep_diary` | Agenda du sommeil | À construire (MVP) |
| `beck_columns` | Colonnes de Beck | Prévu |
| `fear_thermometer` | Thermomètre de la peur | Prévu |
| `emotion_wheel` | Roue des émotions | Prévu |
| `crisis_plan` | Plan de crise | Prévu |
| `rim` | RIM — Imagerie mentale | Prévu |
| `cognitive_saturation` | Saturation cognitive | Prévu |

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend / BDD | Supabase (PostgreSQL + Auth + Edge Functions) |
| Web praticien | React 19 + TypeScript + Vite |
| Mobile patient | React Native 0.81 + Expo SDK 54 + TypeScript |
| State management | Zustand |
| Notifications | Expo Push Notifications |
| Emails | Resend |
| Tunnel dev | ngrok |
