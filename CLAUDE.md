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

> **Règle :** `supabase/schema.sql` (DDL) + `supabase/seed.sql` (données de référence)
> sont la source de vérité du modèle de données. Les deux fichiers sont idempotents
> et peuvent être ré-exécutés à tout stade (BDD vierge, partielle, ou à jour).
>
> - **`schema.sql`** — tables, colonnes, index, RLS, policies, triggers, fonctions, bucket de stockage.
> - **`seed.sql`** — modules, catégories, `module_content_fields`, `field_props`, layouts (sleep_journal, activity_log, exposure_tracker, decision_grid, daily_checkin, column_form, tree_selector). À exécuter APRÈS `schema.sql`.
>
> À chaque modification (nouvelle table, colonne, policy, trigger, index, module, layout) :
> mettre à jour le fichier concerné ET la section ci-dessous.

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
| `sleep_diary` | Agenda du sommeil | Implémenté — moteur générique (`preview_kind='sleep_journal'`), agenda TCC-I 7 jours, SQLite local |
| `beck_columns` | Colonnes de Beck (TCC) | Implémenté — moteur générique (`preview_kind='column_form'`), 5 colonnes DTR (situation/émotion/PA/réponse/résultat), intensité 0–100, SQLite local |
| `fear_thermometer` | Thermomètre de la peur | Implémenté — moteur générique (`preview_kind = 'exposure_tracker'`), tabs Saisies/Situations, SUDS avant/après, stratégies DB-driven |
| `exposure_hierarchy` | Hiérarchie d'exposition (TCC) | Implémenté — `preview_kind='exposure_hierarchy'`, 4 modes (hiérarchies/items/item_form/item_history), DesensitizationChart embedded, table SQLite `exposure_hierarchies` + colonnes `hierarchy_id`/`target_suds`/`is_done` ajoutées à `fear_situations` |
| `emotion_wheel` | Roue des émotions | Implémenté — moteur générique (`preview_kind='tree_selector'`), 3 niveaux Plutchik (primaire→nuance→spécifique), intensité 1–10, SQLite `emotion_entries` |
| `crisis_plan` | Plan de crise (Safety Plan) | Implémenté — protocole Stanley & Brown (2012) + 4 enrichissements VHB-EF : "Mes raisons de tenir" (photos FileSystem + phrase SQLite + message praticien Supabase), mode urgence 1-tap (CrisisUrgencyScreen), cartes de coping personnalisées (praticien→Supabase, patient lecture seule), engagement thérapeutique symbolique (SQLite) ; praticien configure depuis PatientPage |
| `rim` | RIM — Retraitement par Imagerie Mentale | Implémenté — `preview_kind='patient_scenario'`, scénarios alternatifs stockés dans `patient_modules.config` (Supabase), patient en lecture seule |
| `cognitive_saturation` | Saturation cognitive (ACT/TCC) | Implémenté — `preview_kind='guided_exercise'`, tapotement répété sur pensée cible (défusion ACT), SQLite `cognitive_saturation_sessions` |
| `decisional_balance` | Balance décisionnelle | Implémenté — moteur générique (`preview_kind = 'decision_grid'`), grille 2×2 + items pondérés 1–5 étoiles + jauge motivation, `plan_items.weight` + `module_settings`, sous-composant `EditableItemsList` partagé |
| `behavioral_activation` | Activation comportementale | Implémenté — `preview_kind='activity_log'`, liste activités groupées par date, scores Plaisir/Maîtrise 0–10, statut planifiée/réalisée, SQLite `activity_records` |
| `grounding` | Ancrage 5-4-3-2-1 | Implémenté — `preview_kind='guided_exercise'`, exercice DBT sensoriel interactif (Linehan 1993), 3 modes (intro/guided/done), sans stockage de données |
| `mood_tracker` | Thermomètre de l'humeur | Implémenté — 6 dimensions (humeur/énergie/anxiété/plaisir/sommeil/alimentation 1–10, repère « Normal » au centre), écran custom 3 onglets (Saisie/Évolution/Vue d'ensemble), graphiques 7J/1M/3M/1A + axe Y, CompositeChart overlay, repères temporels (Life Chart, SQLite `mood_markers`), heatmap calendrier, rappels, SQLite `scale_entries` |
| `motivational_balance` | Balance motivationnelle | Implémenté — `preview_kind='tabbed'`, 2 onglets (Fiches psyedu + Balance pour/contre), SQLite local |
| `medication_adherence` | Observance médicamenteuse | Implémenté — `preview_kind='daily_checkin'`, checklist quotidienne d'observance, SQLite local |
| `breathing_techniques` | Techniques de respiration | Implémenté — `preview_kind='fields'`, respirations guidées (cohérence cardiaque, respiration abdominale), SQLite local |
| `phq9` | PHQ-9 — Dépression | Implémenté — 9 items, score 0-27, pattern générique ModuleRenderer, SQLite `scale_entries` |
| `gad7` | GAD-7 — Anxiété généralisée | Implémenté — 7 items, score 0-21, pattern générique ModuleRenderer, SQLite `scale_entries` |
| `bsl23` | BSL-23 — Symptômes borderline | Implémenté — 23 items, score moyen 0-4, légende 0-4, pattern générique ModuleRenderer, SQLite `scale_entries` |
| `rcads` | RCADS-25 — Anxiété & dépression (enfant/ado) | Implémenté — 25 items Ebesutani (2012), 6 sous-échelles (TAG/TP/TS/PS/TOC/TD), SQLite local, 20 tests Jest |
| `snap_iv` | SNAP-IV — Dépistage TDAH (enfant/ado) | Implémenté — 26 items, 3 sous-échelles (I/HI/TOD), hétéro-évaluation, pattern générique ModuleRenderer, SQLite `scale_entries` |
| `asrs6` | ASRS v1.1 — Dépistage Rapide (adulte) | Implémenté — 6 items Kessler (2005), score 0-24, pattern générique ModuleRenderer, SQLite `scale_entries` |
| `asrs18` | ASRS v1.1 — Bilan Complet (adulte) | Implémenté — 18 items (Parties A+B), score 0-72, 2 sous-scores, pattern générique ModuleRenderer, SQLite `scale_entries` |
| `epds` | EPDS — Dépression postnatale | Implémenté — 10 items, score 0-30, pattern générique ModuleRenderer, SQLite `scale_entries` |
| `nsi` | NSI — Sévérité des cauchemars | Implémenté — 9 items scorés (0–45) + 2 items contextuels (% récurrents, thèmes), pattern générique ModuleRenderer, SQLite `nsi_entries` |
| `medication_side_effects` | Effets indésirables du traitement | Implémenté — refonte « tracker multi-dimensions » façon `mood_tracker` (composant générique `DimensionTrackerView` mobile + layout générique `SliderDashboardLayout` / `preview_kind='slider_dashboard'` web), 3 onglets Saisie/Évolution/Vue d'ensemble, **effets suivis paramétrables par patient** (sous-ensemble des 12 + effets personnalisés, config partagée praticien↔patient dans `patient_modules.config.tracked_effects`), saisie 0–10 dynamique, repères = événements de traitement, SQLite `scale_entries` |
| `psychoeducation` | Psychoéducation | Implémenté — `preview_kind='cards'`, cartes de savoir thérapeutique, statut lecture par carte, IDs débloqués en Supabase |
| `diet_weight_psycho` | Alimentation et psychotropes | Implémenté — `preview_kind='psyedu'`, 8 fiches `psyedu_topics`/`psyedu_blocks` (general, antipsychotics, methylphenidate, antidepressants, mood_stabilizers, sleep, nutrition, activity) |
| `chronobiology_tracker` | Régularité chronobiologique | Implémenté — `preview_kind='tabbed'` avec 3 onglets : Fiches (`psyedu`), Journal (`column_form` + 5 `column_time_field` optionnels), Mois (`chrono_month`) |
| `distress_tolerance` | Tolérance à la détresse (DBT) | Implémenté — `preview_kind='tabbed'` avec 2 onglets : Fiches (`psyedu`), En crise (`cards`) ; bandeau MDR via `disclaimer_banner` field |
| `craving_journal` | Journal de craving (TCC addictologie) | Implémenté — `preview_kind='tabbed'` avec 2 onglets : Fiches (`psyedu`), Journal (`column_form` : intensity slider 0-10 + 4 textareas trigger/emotion/thought/coping) ; bandeau MDR |
| `motivational_balance` | Balance motivationnelle (Entretien Motivationnel) | Implémenté — écran custom, 4 onglets : Fiches (`psyedu`, 4 topics), Stade (roue Prochaska 6 stades), Thermomètres (importance + confiance 0-10 + question de suivi + phrase d'engagement), Balance (12 valeurs + 2 colonnes Pour/Contre + poids 1-3) ; bouton "i" sources (Miller & Rollnick, Prochaska, SDT, HAS, NICE) ; SQLite local 3 tables (`em_rulers`, `em_balance_items`, `em_values`) ; teen mode ; bandeau MDR ; catégorie Supabase `motivation` |
| `cognitive_distortions` | Distorsions cognitives | Prévu (`preview_kind='coming_soon'`) |
| `therapeutic_commitment` | Engagement thérapeutique | Prévu (`preview_kind='coming_soon'`) |

## Pattern : Questionnaires cliniques (échelles)

Les échelles cliniques standard suivent le **pattern générique ModuleRenderer** — deux écrans partagés + données en base :

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/screens/modules/ScaleHistoryScreen.tsx` | Historique + suppression + chips sous-scores (paramètre `scale_id`) |
| `apps/mobile/src/screens/modules/ScaleEntryScreen.tsx` | Saisie interactive via `FieldRenderer preview_kind='questionnaire'` |
| `apps/mobile/src/lib/scaleScoring.ts` | Config scoring par échelle (`SCALE_SCORING` map) |
| `apps/mobile/src/lib/database.ts` | Table SQLite générique `scale_entries` |
| `supabase/schema.sql` | `module_content_fields` + `field_props` par échelle |

> Chemin du moteur : `apps/mobile/src/components/features/ModuleRenderer/FieldRenderer/` (dossier — entrée + dispatcher + helper ; layouts dans `../layouts/<Nom>/`)

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
- [x] Schéma SQL appliqué sur Supabase
- [ ] Clés Supabase dans les fichiers `.env`
- [ ] App mobile patient (navigation, auth, modules)
- [x] Module Agenda du sommeil (`sleep_diary`) — moteur générique (`preview_kind='sleep_journal'`), agenda TCC-I 7 jours, SQLite local
- [x] Module Plan de crise (`crisis_plan`) — SQLite local, 6 étapes Stanley & Brown, boutons urgence 15/3114, tests Jest+RNTL + enrichissement VHB-EF : 4 nouvelles sections (raisons de tenir, mode urgence 1-tap, cartes coping, engagement), `crisis_anchors` SQLite, `crisisPlanService` mobile+web, 17 tests Jest mobile + 4 tests Vitest web
- [x] Module Balance décisionnelle (`decisional_balance`) — migré vers moteur générique (`preview_kind = 'decision_grid'`), grille 2×2 + items pondérés 1–5 étoiles + jauge motivation, `plan_items.weight` + `module_settings`, sous-composant `EditableItemsList` partagé avec `editable_steps`, signal d'observance Supabase, 10 tests Jest
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
- [x] Module Journal de craving (`craving_journal`) — 4 fiches psyedu (Supabase) + journal auto-monitoring (intensité 0-10, déclencheur, émotion, pensée automatique, stratégie), SQLite local, 2 onglets, bandeau disclaimer MDR, teen mode, 10 tests Jest
- [x] Système de prise de rendez-vous (`calendar_booking`) — praticien : grille semaine pixel, éditeur plages récurrentes + exceptions, toggle auto-confirm, modal RDV ; patient mobile : calendrier mois custom, réservation + annulation ; 3 tables Supabase (availability_rules, availability_exceptions, appointments) + RLS ; 28 tests vitest + 11 tests jest ; spec [`docs/spec/calendar.md`](docs/spec/calendar.md)
- [x] Module Colonnes de Beck (`beck_columns`) — 5 colonnes DTR (situation/émotion/PA/réponse/résultat), intensité 0–100, SQLite local
- [x] Module Roue des émotions (`emotion_wheel`) — 3 niveaux Plutchik (primaire→nuance→spécifique), intensité 1–10, SQLite `emotion_entries`
- [x] Module RIM — Retraitement par Imagerie Mentale (`rim`) — scénarios alternatifs dans `patient_modules.config` (Supabase), patient en lecture seule
- [x] Module Saturation cognitive (`cognitive_saturation`) — défusion ACT, tapotement sur pensée cible, SQLite `cognitive_saturation_sessions`
- [x] Module Activation comportementale (`behavioral_activation`) — activités P/M 0–10, statut planifiée/réalisée, SQLite `activity_records`
- [x] Module Ancrage 5-4-3-2-1 (`grounding`) — exercice DBT sensoriel interactif (Linehan 1993), 3 modes, sans stockage de données
- [x] Module Thermomètre de l'humeur (`mood_tracker`) — refonte : 6 dimensions (repère « Normal » bidirectionnel), écran custom 3 onglets (Saisie/Évolution/Vue d'ensemble), graphiques 7J/1M/3M/1A + axe Y + courbes continues, CompositeChart, repères temporels (Life Chart, `mood_markers` SQLite), heatmap calendrier, rappels, SQLite `scale_entries`, 27 tests Jest
- [x] Module Balance motivationnelle (`motivational_balance`) — 4 onglets (Fiches psyedu, Stade Prochaska, Thermomètres importance/confiance 0-10 + question de suivi, Balance valeurs + 2 colonnes), bouton "i" sources scientifiques, SQLite local (3 tables), teen mode, bandeau MDR, 10 tests Jest
- [x] Module Observance médicamenteuse (`medication_adherence`) — checklist quotidienne d'observance, SQLite local
- [x] Module Techniques de respiration (`breathing_techniques`) — respirations guidées (cohérence cardiaque, abdominale), SQLite local
- [x] Module EPDS — Dépression postnatale (`epds`) — 10 items, score 0-30, pattern générique ModuleRenderer, SQLite `scale_entries`
- [x] Module NSI — Sévérité des cauchemars (`nsi`) — 9 items scorés (0–45) + 2 items contextuels (% récurrents, thèmes), SQLite `nsi_entries`
- [x] Module Effets indésirables du traitement (`medication_side_effects`) — refonte tracker multi-dimensions (pattern `mood_tracker` via composant générique partagé `DimensionTrackerView` mobile + `SliderDashboardLayout`/`slider_dashboard` web), effets suivis paramétrables par patient (12 fixes + personnalisés, config `patient_modules.config.tracked_effects` partagée web↔mobile), saisie 0–10 dynamique, repères = événements de traitement, SQLite `scale_entries`, tests Jest + Vitest
- [x] Module Psychoéducation (`psychoeducation`) — cartes de savoir thérapeutique, statut lecture, IDs débloqués en Supabase
- [x] MFA praticien (`feat/mfa-praticien`, ticket #26, épic conformité #29) — TOTP via Supabase Auth natif (zéro schéma), opt-in par praticien, récupération admin manuelle. Gestion AAL (`aal1`→`aal2`) dans `authService` (`loginWithPassword`→`mfa_required`, `fetchSessionPractitioner` refuse une demi-session), enrôlement QR (`MfaSettingsCard`/`MfaEnrollModal`), challenge au login (`MfaChallengeForm`). Doc : [`docs/auth-mfa.md`](docs/auth-mfa.md)
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

> **Cas rencontré — refonte-effets-du-traitement (2026-06-02) :**
> Un dégradé de couleur de **sévérité** apposé sur les options de réponse d'une
> échelle clinique (`medication_side_effects`) — `field_props` : option « absent »
> = gris `#9CA3AF` … option « sévère » = **rouge `#EF4444`**, rendu par `LikertWidget`.
> ```
> ❌ Le rouge est piloté par la valeur clinique la plus grave → le code interprète
>    (sévère = alarmant) au lieu d'afficher la valeur brute.
> ```
> → Couleurs d'options **neutres et uniformes**. Le codage couleur d'une gravité
> clinique est interdit, même statique (pas seulement quand un seuil le déclenche).

---

## Règles de développement

- Toute nouvelle feature doit être accompagnée d'un fichier `.md` de documentation ET de tests avant d'être considérée comme terminée.
- **Feedback utilisateur web — toujours utiliser `useToast()`** pour les résultats d'opérations réseau (save, update, delete, erreur serveur). Ne jamais créer d'état `error`/`success` local pour une opération réseau. Réserver les états locaux inline à la validation de champ (email invalide, champ requis). Hook : `import { useToast } from '../contexts/ToastContext'` — doc complète : [`apps/web/docs/components/toast.md`](apps/web/docs/components/toast.md).
- **Pas de SQL ni d'appel Supabase dans un composant** — toute opération de données passe par une fonction d'un service `apps/<app>/src/services/<domaine>Service.ts`. Seules exceptions : les clients d'infrastructure dans `src/lib/` (`supabase.ts`, `database.ts` SQLite). Détails et procédure : [`.claude/rules/coding-standards.md`](.claude/rules/coding-standards.md) section *Accès aux données* + [`docs/services.md`](docs/services.md).
- **Nouveau module = passer par le skill [`module-builder`](.claude/skills/module-builder/SKILL.md).** Il enforce la règle data-first (`modules` + `module_content_fields` + `field_props` → `FieldRenderer` web et mobile) : zéro page hardcodée, parité aperçu praticien web ≡ écran patient mobile garantie par construction, composants génériques réutilisés avant d'être créés, tests et documentation obligatoires. Lecture préalable indispensable : [`docs/module-engine.md`](docs/module-engine.md).
- **Avant tout merge = passer par le skill [`pr-review`](.claude/skills/pr-review/SKILL.md).** Il lit chaque fichier modifié/ajouté en entier et applique toutes les rules du projet (coding-standards, config-first, MDR, design system, i18n, tests, doc). Produit un rapport avec violations bloquantes et points d'attention, avec références `fichier:ligne`.
- **Pour les modules legacy à écran mobile dédié** (animation Reanimated, machine d'état multi-écrans interactive), garder l'ordre web-puis-mobile :
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

> Composant métier `PsyEduBlockRenderer` : `apps/mobile/src/components/features/PsyEduBlockRenderer.tsx`

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
| `apps/mobile/src/components/features/DisclaimerBanner.tsx` | Composant partagé — `moduleKey` + `isTeenMode` |
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
| `apps/mobile/src/components/features/TeenAccent.tsx` | Bande colorée en haut d'un écran (4px, invisible si mode adulte) |
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
- **Import de `TeenAccent`** depuis un écran : `from '../../components/features/TeenAccent'`
- **Conformité MDR** : le mode ado modifie uniquement le lexique et la palette — aucune logique conditionnelle sur les données cliniques.

## Pattern : Système de rendez-vous (calendar_booking)

Prise de RDV entre praticien et patient, sans librairie de calendrier externe.

| Fichier | Rôle |
|---|---|
| `apps/web/src/lib/calendar.types.ts` | Types partagés côté web (AvailabilityRule, Appointment, ComputedSlot…) |
| `apps/web/src/services/appointmentService.ts` | Service web : CRUD Supabase + `computeAvailableSlots` (pure function) |
| `apps/web/src/components/features/WeekGrid/` | Grille semaine pixel — `HOUR_HEIGHT_PX=64`, positionnement absolu par calcul minutes |
| `apps/web/src/components/features/AvailabilityEditor/` | Sidebar : règles récurrentes + exceptions + toggle `auto_confirm` |
| `apps/web/src/components/features/AppointmentModal/` | Modal création (mode `create`) / visualisation (mode `view`) |
| `apps/web/src/pages/AgendaPage.tsx` | Page principale praticien — charge tout via `Promise.all` |
| `apps/mobile/src/services/appointmentService.ts` | Service mobile — même `computeAvailableSlots`, + `fetchPatientPractitioner` |
| `apps/mobile/src/screens/AppointmentsScreen.tsx` | Liste RDV patient (à venir / passés), annulation avec Alert |
| `apps/mobile/src/screens/BookAppointmentScreen.tsx` | Calendrier mois maison + sélection créneau + `bookAppointment` |

### Règles architecturales

- **`computeAvailableSlots`** est une pure function (zéro réseau) — elle tourne côté client pour afficher les créneaux disponibles dans la grille web et le calendrier mois mobile.
- **Convention `day_of_week`** : `0=Lundi … 6=Dimanche` en base. JS `Date.getDay()` renvoie `0=Dimanche` → toujours passer par `jsDayToSchema()` pour la conversion.
- **La grille semaine s'affiche toujours**, même sans règles configurées — les colonnes sont vides, le praticien navigue librement et ouvre l'éditeur via "Configurer".
- **`auto_confirm_appointments`** sur `practitioners` : `true` → RDV créé en `confirmed` ; `false` → `pending` (le praticien confirme manuellement).
- Spec complète : [`docs/spec/calendar.md`](docs/spec/calendar.md).

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

## Pattern : Fiches psychoéducatives (psyedu)

Pour tout contenu psychoéducatif structuré (fiches, articles, protocoles), utiliser le pattern suivant — **ne jamais stocker de contenu en dur dans le code TypeScript**. Rendu via le `preview_kind = 'psyedu'` du ModuleRenderer (wrappe `PsyEduBlockRenderer`).

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
