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

> **Règle :** `supabase/schema.sql` est la source de vérité du modèle de données.
> À chaque modification du schéma (nouvelle table, colonne, policy, trigger, index),
> mettre à jour ce fichier ET la section ci-dessous pour qu'ils restent synchronisés.

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
| `crisis_plan` | Plan de crise (Safety Plan) | Implémenté — protocole Stanley & Brown (2012) |
| `rim` | RIM — Imagerie mentale | Prévu |
| `cognitive_saturation` | Saturation cognitive | Prévu |
| `decisional_balance` | Balance décisionnelle | Implémenté — grille 2×2 + jauge de motivation, SQLite local, signal Supabase |

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
- [x] Module Plan de crise (`crisis_plan`) — SQLite local, 6 étapes Stanley & Brown, boutons urgence 15/3114, tests Jest+RNTL
- [x] Module Balance décisionnelle (`decisional_balance`) — grille 2×2 + jauge de motivation, SQLite local, signal d'observance Supabase, 10 tests Jest
- [x] Table `patient_engagement_logs` créée sur Supabase (RLS, policies insert patient + select praticien)
- [ ] Notifications push

## Vision commerciale

À terme : SaaS B2B vendu à d'autres praticiens (psychologues, IPA, médecins).
Migration vers hébergement HDS (OVHcloud) requise avant mise en production commerciale.

## RÈGLE D'OR — Statut Non-Dispositif Médical (MDR 2017/745)

> **Cette règle s'applique à chaque ligne de code produite pour PsyTool, sans exception.**

PsyTool est et doit rester un **Carnet de Bord Numérique** — non-Dispositif Médical au sens du règlement européen MDR 2017/745.

**Principe fondamental : le code affiche, jamais il ne conclut.** L'interprétation appartient exclusivement au patient ou au soignant.

**INTERDIT — provoque une requalification en Dispositif Médical :**

| Cas interdit | Exemple concret |
|---|---|
| Algorithme qui interprète et suggère une action | "Vous avez mal dormi, faites ceci" |
| Alerte automatique déclenchée par les données | Notification si score dépasse un seuil |
| Score affiché avec un label interprétatif | "Score 18 = dépression sévère" |
| Graphique de tendance qui implique une dégradation | Flèche rouge, message "état en baisse" |
| Notification conditionnelle aux données saisies | "Tu n'as pas dormi 3 nuits, pense à…" |
| Seuil numérique qui déclenche quoi que ce soit | `if (score > 7) then...` |
| Comparaison à une norme ou à une population | "Vous dormez moins que la moyenne" |

**AUTORISÉ :**
- Afficher le chiffre brut saisi par le patient, sans label ni couleur interprétative
- Afficher un historique neutre (liste, graphique sans commentaire)
- Calculer un score uniquement pour que le praticien le lise et l'interprète en consultation
- Envoyer un rappel d'horaire fixe programmé à l'avance par le praticien (non conditionnel aux données)

Si une demande franchit cette ligne : opposer un veto immédiat, expliquer le risque de requalification, et proposer une alternative d'affichage passif conforme.

---

## Règles de développement

- Toute nouvelle feature doit être accompagnée d'un fichier `.md` de documentation ET de tests avant d'être considérée comme terminée.
- **Nouveau module = web + mobile simultanément, dans cet ordre :**
  1. **Web d'abord** — ajouter le `ModuleType` dans `database.types.ts` (`MODULE_LABELS`, `MODULE_DESCRIPTIONS`), l'intégrer dans la bonne catégorie de `PatientPage.tsx` (armoire thérapeutique). Le praticien doit pouvoir débloquer le module avant que le patient puisse y accéder.
  2. **Mobile ensuite** — créer l'écran dans `apps/mobile/src/screens/modules/`, câbler la navigation dans `AppStack.tsx`, ajouter l'entrée dans `MODULE_CONFIG` de `HomeScreen.tsx`.
  3. Ne jamais livrer un module mobile sans son pendant web, ni vice-versa : un module invisible dans l'armoire praticien ne peut pas être débloqué pour le patient.

## MCP disponible

Le MCP Supabase est configuré dans `~/.claude/settings.json` via token personnel.
Il permet de gérer la BDD, appliquer des migrations et récupérer les clés API directement.
