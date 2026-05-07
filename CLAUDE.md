# PsyTool — Contexte général

## Qu'est-ce que PsyTool ?

Outil d'accompagnement thérapeutique en deux parties :
- **Interface web praticien** — tableau de bord pour gérer les patients et débloquer des modules
- **App mobile patient** — accès aux outils thérapeutiques débloqués par le praticien

Le praticien invite ses patients par email. Les patients installent l'app, s'inscrivent via un lien unique, et accèdent aux modules que le praticien leur débloque au fil des consultations.

## Utilisateur principal

Consultant ou thérapeute parmi les corps de métier suivants : IDE, IPA, psychiatre, pédopsychiatre, addictologue, médecin généraliste, psychologue. **Novice complet en développement** — toujours expliquer les étapes, donner des commandes exactes à copier-coller, ne jamais supposer de connaissance technique préalable. La qualité du code doit rester optimale malgré cela.

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

Voir [`docs/invitation-flow.md`](docs/invitation-flow.md) pour le schéma complet, les étapes détaillées et les cas d'erreur.

## Modules thérapeutiques

| Clé | Nom | Statut |
|---|---|---|
| `sleep_diary` | Agenda du sommeil | MVP — à construire |
| `beck_columns` | Colonnes de Beck (TCC) | Prévu |
| `fear_thermometer` | Thermomètre de la peur | Implémenté — moteur générique (`preview_kind = 'exposure_tracker'`), tabs Saisies/Situations, SUDS avant/après, stratégies DB-driven |
| `emotion_wheel` | Roue des émotions | Prévu |
| `crisis_plan` | Plan de crise (Safety Plan) | Implémenté — protocole Stanley & Brown (2012) |
| `rim` | RIM — Imagerie mentale | Prévu |
| `cognitive_saturation` | Saturation cognitive | Prévu |
| `decisional_balance` | Balance décisionnelle | Implémenté — grille 2×2 + jauge de motivation, SQLite local, signal Supabase |
| `phq9` | PHQ-9 — Dépression | Implémenté — 9 items, score 0-27, pattern générique ModuleRenderer, SQLite `scale_entries` |
| `gad7` | GAD-7 — Anxiété généralisée | Implémenté — 7 items, score 0-21, pattern générique ModuleRenderer, SQLite `scale_entries` |
| `bsl23` | BSL-23 — Symptômes borderline | Implémenté — 23 items, score moyen 0-4, légende 0-4, pattern générique ModuleRenderer, SQLite `scale_entries` |
| `rcads` | RCADS-25 — Anxiété & dépression (enfant/ado) | Implémenté — 25 items Ebesutani (2012), 6 sous-échelles (TAG/TP/TS/PS/TOC/TD), SQLite local, 20 tests Jest |
| `snap_iv` | SNAP-IV — Dépistage TDAH (enfant/ado) | Implémenté — 26 items, 3 sous-échelles (I/HI/TOD), hétéro-évaluation, pattern générique ModuleRenderer, SQLite `scale_entries` |
| `asrs6` | ASRS v1.1 — Dépistage Rapide (adulte) | Implémenté — 6 items Kessler (2005), score 0-24, pattern générique ModuleRenderer, SQLite `scale_entries` |
| `asrs18` | ASRS v1.1 — Bilan Complet (adulte) | Implémenté — 18 items (Parties A+B), score 0-72, 2 sous-scores, pattern générique ModuleRenderer, SQLite `scale_entries` |

## Pattern : Questionnaires cliniques (échelles)

Les échelles cliniques standard suivent le **pattern générique ModuleRenderer** — deux écrans partagés + données en base :

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/screens/modules/ScaleHistoryScreen.tsx` | Historique + suppression + chips sous-scores (paramètre `scale_id`) |
| `apps/mobile/src/screens/modules/ScaleEntryScreen.tsx` | Saisie interactive via `FieldRenderer preview_kind='questionnaire'` |
| `apps/mobile/src/lib/scaleScoring.ts` | Config scoring par échelle (`SCALE_SCORING` map) |
| `apps/mobile/src/lib/database.ts` | Table SQLite générique `scale_entries` |
| `supabase/schema.sql` | `module_content_fields` + `field_props` par échelle |

**Ajouter une nouvelle échelle générique :**
1. Ajouter la config dans `SCALE_SCORING` (scaleScoring.ts)
2. Ajouter les clés i18n dans fr/en common.json + fr/en teen.json
3. Ajouter le module dans `modules` Supabase avec `preview_kind = 'questionnaire'`
4. Insérer les `module_content_fields` (instructions, options, questions, footer) + `field_props`
5. Ajouter l'entrée dans `GENERIC_SCALE_TYPES` (HomeScreen.tsx) si pas déjà présent
6. Ajouter l'icône dans `MODULE_CONFIG` (HomeScreen.tsx)

**Échelles multi-dimensionnelles** (sous-scores) : implémenter `computeSubscaleScores` dans `SCALE_SCORING` et ajouter la map `CHIP_KEY_TO_SUBSCALE` dans `ScaleHistoryScreen.tsx`.

**Hétéro-évaluation** (ex. SNAP-IV) : ajouter un champ `scale_warning` dans `module_content_fields`.

**Exceptions** : les échelles avec logique conditionnelle (C-SSRS) restent sur écrans custom dédiés.

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
- [x] Module PHQ-9 (`phq9`) — 9 items, SQLite local, tests RNTL
- [x] Module GAD-7 (`gad7`) — 7 items, SQLite local, tests RNTL
- [x] Module BSL-23 (`bsl23`) — 23 items, SQLite local, tests RNTL
- [x] Module RCADS-25 (`rcads`) — 25 items, 6 sous-échelles, SQLite local, 20 tests Jest
- [x] Module SNAP-IV (`snap_iv`) — 26 items, 3 sous-échelles (I/HI/TOD), hétéro-évaluation parent/enseignant, SQLite local, tests Jest
- [x] Module ASRS v1.1 Dépistage (`asrs6`) — 6 items, score 0-24, auto-évaluation adulte, bouton info référence PubMed, SQLite local, tests Jest
- [x] Module ASRS v1.1 Bilan Complet (`asrs18`) — 18 items (Parties A+B), score 0-72 + sous-scores, bouton info PubMed, SQLite local, tests Jest
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
- **Pas de SQL ni d'appel Supabase dans un composant** — toute opération de données passe par une fonction d'un service `apps/<app>/src/services/<domaine>Service.ts`. Seules exceptions : les clients d'infrastructure dans `src/lib/` (`supabase.ts`, `database.ts` SQLite). Détails et procédure : [`.claude/rules/coding-standards.md`](.claude/rules/coding-standards.md) section *Accès aux données* + [`docs/services.md`](docs/services.md).
- **Nouveau module = web + mobile simultanément, dans cet ordre :**
  1. **Web d'abord** — ajouter le `ModuleType` dans `database.types.ts` (`MODULE_LABELS`, `MODULE_DESCRIPTIONS`), l'intégrer dans la bonne catégorie de `PatientPage.tsx` (armoire thérapeutique). Le praticien doit pouvoir débloquer le module avant que le patient puisse y accéder.
  2. **Mobile ensuite** — créer l'écran dans `apps/mobile/src/screens/modules/`, câbler la navigation dans `AppStack.tsx`, ajouter l'entrée dans `MODULE_CONFIG` de `HomeScreen.tsx`.
  3. Ne jamais livrer un module mobile sans son pendant web, ni vice-versa : un module invisible dans l'armoire praticien ne peut pas être débloqué pour le patient.

## Pattern : Mode Ado (teen mode)

Le mode ado adapte l'interface de l'app mobile pour les patients adolescents — tutoiement et palette visuelle vive. Il est activé par le praticien depuis la fiche patient web.

### Architecture

| Fichier | Rôle |
|---|---|
| `supabase/schema.sql` | Colonne `teen_mode boolean default false` sur `practitioner_patients` |
| `apps/mobile/src/store/authStore.ts` | Champ `teenMode: boolean` + `fetchTeenMode()` appelé au login |
| `apps/mobile/src/theme/teen.ts` | Palette vive par module, textes bilingues adulte/ado |
| `apps/mobile/src/hooks/useTeen.ts` | Hook `useTeen()` → `{ isTeenMode, tt, tg, teenColor }` |
| `apps/mobile/src/components/TeenAccent.tsx` | Bande colorée en haut d'un écran (4px, invisible si mode adulte) |
| `apps/web/src/pages/PatientPage.tsx` | Bouton toggle "Mode ado" dans le header patient |

### Règles

- **Le praticien** active/désactive le mode via le bouton de la fiche patient. Le patient n'a pas accès à ce réglage.
- **Le mode ne change pas la structure** des écrans, ni la navigation, ni les données.
- **Tout nouveau écran de module** doit importer `useTeen` et `TeenAccent`, et passer `teenColor('nom_du_module')` au composant.
- **Tout nouveau texte adaptable** doit être ajouté dans `TEEN_MODULE_TEXTS` de `teen.ts` sous la forme `{ adult: '...', teen: '...' }`.
- **Tout test d'écran** qui importe un écran module doit mocker `useTeen` :
  ```ts
  jest.mock('../../hooks/useTeen', () => ({
    useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
  }))
  ```
- **Conformité MDR** : le mode ado modifie uniquement le lexique et la palette — aucune logique conditionnelle sur les données cliniques.

## Documentation technique

Index complet : [`docs/README.md`](docs/README.md). Conventions :

- **Transversal au monorepo** → `docs/` (architecture, base de données, flux d'invitation, module engine, modules thérapeutiques)
- **Spécifique à une app** → `apps/<app>/docs/` (design system de l'app, composants UI propres)
- **Documentation par module** → `docs/modules/<module_id>.md` (un fichier par module thérapeutique implémenté)

Points d'entrée fréquents :

| Document | Contenu |
|---|---|
| `docs/README.md` | Index général de la documentation |
| `docs/modules.md` | Liste et statut de tous les modules thérapeutiques |
| `docs/module-engine.md` | Circuit complet : schéma SQL → service → FieldRenderer → widgets |
| `docs/services.md` | Couche services web et mobile (responsabilités, conventions, patterns) |
| `docs/architecture.md` / `docs/database.md` | Vue d'ensemble technique et schéma BDD |
| `apps/web/docs/design-system.md` | CSS custom properties, classes `preview-*` et `fw-*`, widgets HTML |
| `apps/mobile/docs/design-system.md` | StyleSheet patterns, composants primitifs, Teen mode complet |
| `apps/web/docs/components/module-renderer.md` | Détails web : table `FieldText CONFIG`, extensions field_type/preview_kind |

## MCP disponible

Le MCP Supabase est configuré dans `~/.claude/settings.json` via token personnel.
Il permet de gérer la BDD, appliquer des migrations et récupérer les clés API directement.
