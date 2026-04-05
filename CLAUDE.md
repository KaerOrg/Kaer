# PsyTool — Contexte général

## Qu'est-ce que PsyTool ?

Outil d'accompagnement thérapeutique en deux parties :
- **Interface web praticien** — tableau de bord pour gérer les patients et débloquer des modules
- **App mobile patient** — accès aux outils thérapeutiques débloqués par le praticien

Le praticien invite ses patients par email. Les patients installent l'app, s'inscrivent via un lien unique, et accèdent aux modules que le praticien leur débloque au fil des consultations.

## Utilisateur principal

Infirmier en Pratique Avancée (IPA) en psychiatrie. **Novice complet en développement** — toujours expliquer les étapes, donner des commandes exactes à copier-coller, ne jamais supposer de connaissance technique préalable. La qualité du code doit rester optimale malgré cela.

## Stack technique

| Couche | Technologie |
|---|---|
| Backend / BDD | Supabase (PostgreSQL + Auth + API REST) |
| Web praticien | React + TypeScript + Vite |
| Mobile patient | React Native + Expo + TypeScript |
| State management | Zustand |
| Offline storage | expo-sqlite + MMKV |
| Notifications | Expo Push Notifications |
| Hébergement | Supabase cloud (gratuit → OVHcloud HDS à terme) |

## Structure du projet (monorepo npm workspaces)

```
PsyTool/
├── apps/
│   ├── web/          # Interface praticien (React + Vite)
│   └── mobile/       # App patient (Expo + React Native)
├── packages/
│   └── shared/       # Types TypeScript partagés
├── supabase/
│   └── schema.sql    # Schéma de base de données
└── CLAUDE.md
```

## Lancer le projet

```bash
# App web praticien (depuis la racine)
npm run web

# App mobile patient (depuis la racine)
npm run mobile
```

## Schéma de base de données

5 tables principales :

- **practitioners** — profils praticiens (liés à auth.users)
- **patients** — profils patients (liés à auth.users)
- **practitioner_patients** — relation praticien ↔ patient (avec alias optionnel)
- **invitations** — liens d'invitation envoyés aux patients (token unique, expire 48h)
- **patient_modules** — modules débloqués par patient (avec config JSON)

Row Level Security (RLS) activée sur toutes les tables.

## Règles métier fondamentales

- **Aucune donnée clinique stockée** côté serveur (pas de diagnostic, pas de notes)
- Auth par email/mot de passe uniquement
- Un patient **ne peut pas s'inscrire seul** — il faut une invitation du praticien
- Les données d'exercices sont **stockées en local** sur le téléphone du patient par défaut
- Le patient peut **choisir** de partager ses données avec son praticien
- Le praticien peut **révoquer** un module à tout moment
- **Notifications** : le praticien programme les rappels, le patient peut ajuster l'heure

## Flux d'invitation patient

```
Praticien saisit l'email → token UUID généré (expire 48h) → stocké en BDD
→ Patient reçoit lien → crée son compte → lié au praticien → espace vide
→ Praticien débloque des modules → patient y accède dans l'app
```

## Modules thérapeutiques

| Clé | Nom | Statut |
|---|---|---|
| `sleep_diary` | Agenda du sommeil | MVP — à construire |
| `beck_columns` | Colonnes de Beck (TCC) | Prévu |
| `fear_thermometer` | Thermomètre de la peur | Prévu |
| `emotion_wheel` | Roue des émotions | Prévu |
| `crisis_plan` | Plan de crise | Prévu |
| `rim` | RIM — Imagerie mentale | Prévu |
| `cognitive_saturation` | Saturation cognitive | Prévu |

## État d'avancement

- [x] Structure monorepo créée
- [x] App web praticien scaffoldée et codée (login, dashboard, page patient, déverrouillage modules)
- [x] App mobile patient scaffoldée (Expo, dépendances installées)
- [x] Package shared (types TypeScript)
- [x] Schéma SQL écrit (`supabase/schema.sql`)
- [x] MCP Supabase configuré (`~/.claude/settings.json`)
- [ ] Schéma SQL appliqué sur Supabase
- [ ] Clés Supabase dans les fichiers `.env`
- [ ] App mobile patient (navigation, auth, modules)
- [ ] Module Agenda du sommeil
- [ ] Notifications push

## Vision commerciale

À terme : SaaS B2B vendu à d'autres praticiens (psychologues, IPA, médecins).
Migration vers hébergement HDS (OVHcloud) requise avant mise en production commerciale.

## MCP disponible

Le MCP Supabase est configuré dans `~/.claude/settings.json` via token personnel.
Il permet de gérer la BDD, appliquer des migrations et récupérer les clés API directement.
