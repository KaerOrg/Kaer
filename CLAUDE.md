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
| `exposure_hierarchy` | Hiérarchie d'exposition (TCC) | Implémenté — liste graduée SUDs 0-100, case à cocher neutre, bandeau disclaimer, sources HAS/NICE, SQLite local, teen mode, 15 tests Jest |
| `emotion_wheel` | Roue des émotions | Prévu |
| `crisis_plan` | Plan de crise (Safety Plan) | Implémenté — protocole Stanley & Brown (2012) |
| `rim` | RIM — Imagerie mentale | Prévu |
| `cognitive_saturation` | Saturation cognitive | Prévu |
| `decisional_balance` | Balance décisionnelle | Implémenté — grille 2×2 + jauge de motivation, SQLite local, signal Supabase |
| `phq9` | PHQ-9 — Dépression | Implémenté — 9 items, score 0-27, SQLite local, tests RNTL |
| `gad7` | GAD-7 — Anxiété généralisée | Implémenté — 7 items, score 0-21, SQLite local, tests RNTL |
| `bsl23` | BSL-23 — Symptômes borderline | Implémenté — 23 items, score moyen 0-4, SQLite local, tests RNTL |
| `rcads` | RCADS-25 — Anxiété & dépression (enfant/ado) | Implémenté — 25 items Ebesutani (2012), 6 sous-échelles (TAG/TP/TS/PS/TOC/TD), SQLite local, 20 tests Jest |
| `snap_iv` | SNAP-IV — Dépistage TDAH (enfant/ado) | Implémenté — 26 items, 3 sous-échelles (I/HI/TOD), hétéro-évaluation parent/enseignant, SQLite local, tests Jest |
| `asrs6` | ASRS v1.1 — Dépistage Rapide (adulte) | Implémenté — 6 items Kessler (2005), score 0-24, auto-évaluation, bouton info PubMed, SQLite local, tests Jest |
| `asrs18` | ASRS v1.1 — Bilan Complet (adulte) | Implémenté — 18 items (Parties A+B), score 0-72, 2 sous-scores, bouton info PubMed, SQLite local, tests Jest |
| `diet_weight_psycho` | Alimentation et psychotropes | Implémenté — 8 fiches psychoéducatives, contenu en base Supabase, rendu bloc par bloc, teen mode |
| `chronobiology_tracker` | Régularité chronobiologique | Implémenté — 7 fiches psyedu (zeitgebers, IPSRT, lumière, repas, rythme social, lever/coucher, perturbations) + journal des 5 ancrages quotidiens (SQLite local), 2 onglets, teen mode |
| `distress_tolerance` | Tolérance à la détresse (DBT) | Implémenté — 6 fiches psyedu (intro, TIPP, ACCEPTS, self-soothing, IMPROVE, pros & cons) + onglet "En crise" (accordéon), bandeau disclaimer MDR, teen mode, 8 tests Jest |

## Pattern : Questionnaires cliniques (échelles)

Les questionnaires suivent un pattern uniforme à 3 fichiers :
- `apps/mobile/src/data/<scale>.ts` — items, options, calcul des scores (exporté et testé unitairement)
- `apps/mobile/src/screens/modules/<Scale>Screen.tsx` — historique, suppression, mini-cartes de résultats
- `apps/mobile/src/screens/modules/<Scale>EntryScreen.tsx` — saisie avec `QuestionRow` + validation

**Échelles multi-dimensionnelles (RCADS-25, SNAP-IV)** : contrairement aux échelles à score unique, elles stockent un objet JSON de sous-scores en plus du `total_score`. L'écran liste affiche les sous-scores sous forme de chips. Toute nouvelle échelle multi-dimensionnelle doit suivre ce pattern.

**SNAP-IV spécificité** : hétéro-évaluation obligatoire (parent/enseignant, pas l'enfant). L'écran de saisie affiche un bandeau d'avertissement jaune et groupe les 26 items en 3 sections visuelles avec `SectionHeader`.

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
- [x] Module Alimentation et psychotropes (`diet_weight_psycho`) — 8 fiches, contenu Supabase (psyedu_topics + psyedu_blocks), rendu bloc custom, teen mode, 10 tests Jest
- [x] Module Régularité chronobiologique (`chronobiology_tracker`) — 7 fiches psyedu (Supabase) + journal des 5 ancrages quotidiens (SQLite local), 2 onglets Fiches/Journal, teen mode, 8 tests Jest
- [x] Module Tolérance à la détresse (`distress_tolerance`) — 6 fiches psyedu (DBT : TIPP, ACCEPTS, self-soothing, IMPROVE, pros & cons), onglet "En crise" accordéon, bandeau disclaimer MDR, teen mode, 8 tests Jest
- [x] Module Hiérarchie d'exposition (`exposure_hierarchy`) — liste graduée SUDs 0-100, cases à cocher neutres, bandeau disclaimer, sources HAS/NICE/Wolpe/Foa, SQLite local, teen mode, 15 tests Jest
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

## Pattern : Module mixte psyedu + journal (chronobiology_tracker)

Ce pattern combine fiches psychoéducatives et tracker de données locales dans un même module, avec deux onglets.

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/screens/modules/ChronoBioScreen.tsx` | Écran principal — segment control Fiches / Journal |
| `apps/mobile/src/screens/modules/ChronoBioDetailScreen.tsx` | Détail d'une fiche psyedu (BlockRenderer) |
| `apps/mobile/src/screens/modules/ChronoBioEntryScreen.tsx` | Formulaire de saisie des 5 ancrages horaires |
| `apps/mobile/src/lib/database.ts` | Table `chrono_entries` + CRUD (`ChronoEntry`, `saveChronoEntry`, etc.) |
| `supabase/seed/chrono_seed.sql` | Seed idempotent — 7 topics + blocs |
| `apps/mobile/src/i18n/locales/fr/psyedu.json` | Namespace `chronobiology_tracker` |
| `apps/mobile/src/i18n/locales/fr/psyedu_teen.json` | Surcharges tutoiement |

### Règles

- **Onglets** : implémentés avec un segment control maison (2 `Pressable` + `activeTab` state), pas de React Navigation Tab imbriqué.
- **Journal** : données 100% locales (SQLite). Aucune donnée de timing envoyée à Supabase.
- **Champs optionnels** : chaque ancrage peut être nul — composant `OptionalTimeField` avec bouton clear.
- **MDR** : aucun score, aucun calcul, aucun seuil — le journal affiche uniquement les horaires bruts saisis par le patient.
- **Reload** : `useFocusEffect` + `listChronoEntries(14)` pour actualiser l'historique au retour depuis `ChronoBioEntryScreen`.

## Pattern : Bandeau disclaimer MDR (`DisclaimerBanner`)

Pour tout module affichant une technique thérapeutique, ajouter un bandeau d'avertissement en haut de l'écran liste.

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/components/DisclaimerBanner.tsx` | Composant partagé — `moduleKey` + `isTeenMode` |
| `apps/mobile/src/i18n/locales/fr/common.json` | Clé `modules.<moduleKey>.disclaimer` (vouvoiement) |
| `apps/mobile/src/i18n/locales/fr/teen.json` | Clé `modules.<moduleKey>.disclaimer` (tutoiement) |

### Usage

```tsx
<DisclaimerBanner moduleKey="exposure_hierarchy" isTeenMode={isTeenMode} />
```

### Règle

- Le composant lit `modules.<moduleKey>.disclaimer` dans le namespace `common` (adulte) ou `teen` (ado).
- **Tout nouveau module** présentant une technique clinique (TCC, DBT, etc.) doit inclure ce bandeau.
- Texte adulte type : *"Ce module est un support à vos consultations. Les techniques présentées ont été abordées avec votre soignant — il ne remplace pas votre suivi thérapeutique."*

---

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

## Pattern : Fiches psychoéducatives (psyedu)

Pour tout contenu psychoéducatif structuré (fiches, articles, protocoles), utiliser le pattern suivant — **ne jamais stocker de contenu en dur dans le code TypeScript**.

### Architecture

| Fichier | Rôle |
|---|---|
| `supabase/schema.sql` | Tables `psyedu_topics` (métadonnées) + `psyedu_blocks` (blocs de contenu) |
| `supabase/seed/psyedu_seed.sql` | Seed idempotent avec UUIDs fixes |
| `packages/shared/src/index.ts` | Types `PsyEduTopic`, `PsyEduBlock`, `PsyEduSectionKey`, `PsyEduBlockType` |
| `apps/mobile/src/services/psyeduService.ts` | `fetchTopicsByModule`, `fetchBlocksByTopic`, `clearPsyEduCache` |
| `apps/mobile/src/components/InlineText.tsx` | Rendu inline avec **bold** + fallback teen mode |
| `apps/mobile/src/components/PsyEduBlockRenderer.tsx` | Rendu des blocs (heading, paragraph, bullet_list, tip, blockquote, source_link) |
| `apps/mobile/src/i18n/locales/fr/psyedu.json` | Traductions adulte (vouvoiement) |
| `apps/mobile/src/i18n/locales/fr/psyedu_teen.json` | Surcharges tutoiement (teen mode — clés partielles) |

### Règles

- **Textes en base** : uniquement des `text_code` (clés i18n) — jamais de texte brut.
- **Traductions dans l'app** : namespace `psyedu` (adulte) + `psyedu_teen` (tutoiement, fallback sur `psyedu`).
- **Icônes** : `lucide-react-native` uniquement — nom de l'icône stocké dans `icon_name` du topic.
- **Tri des sections** : côté client (`SECTION_ORDER = { why: 0, how: 1, sources: 2 }`) — ne pas se fier à l'ordre alphabétique de la BDD.
- **Cache mémoire** : `psyeduService` maintient un cache Map en session — appeler `clearPsyEduCache()` si besoin de forcer un rechargement.
- **Pas de react-native-markdown-display** : utiliser `PsyEduBlockRenderer` + `InlineText`.

## MCP disponible

Le MCP Supabase est configuré dans `~/.claude/settings.json` via token personnel.
Il permet de gérer la BDD, appliquer des migrations et récupérer les clés API directement.
