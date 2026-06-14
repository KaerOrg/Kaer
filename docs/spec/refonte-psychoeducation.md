# Refonte — Psychoéducation (bibliothèque thématique unifiée)

> Branche : `refonte/psychoeducation`. Statut : **Phases 0-3 livrées, contenu des 11 fiches réécrit (action-first, langage patient, sources DOI), seeds consolidés (Phase 5), Phase 4 = filtre par facettes + « suggérer un thème » livrés. Reste optionnel : parcours thématiques, lien fiche vers outil, nettoyage résiduel.**
> Ce document est la source de vérité de la refonte. Mettre à jour au fil de l'avancement.

> **Intégration (2026-06-11)** : branche réconciliée avec `feat/improve-module-organization`
> (réorganisation de l'armoire par facettes / taxonomie). Cette branche étant en retard
> sur `main`, on a **cherry-pické son commit `75eb580`** par-dessus la refonte (plutôt
> qu'un rebase qui rejouait 10 commits de main). Taxonomie plus dupliquée (version de
> cette branche = canonique), `ModuleFilterBar` + `PsychoLibraryPicker` coexistent dans
> `PatientModulesTab`, suite web 642 tests verts. Les tags serviront au filtre de la
> bibliothèque (Phase 4).

---

## 1. Constat — l'état réel du code (et non celui des docs périmées)

Trois mécanismes coexistent pour « afficher un contenu à lire au patient », empilés au fil du temps. **Une migration vers la base a été commencée mais jamais terminée.**

| # | Mécanisme | Contenu | Rendu | État réel |
|---|---|---|---|---|
| **A** | Module legacy `psychoeducation` | Cartes **codées en dur** dans `apps/mobile/src/constants/psychoeducationCards.ts` (5 cartes) | Écrans bespoke `PsychoeducationScreen` + `CardDetailScreen` | **Vivant sur mobile** : forcé via l'override `MODULE_SCREEN_MAP` (`psychoeducation → 'Psychoeducation'`) dans `HomeScreen.tsx` |
| **A′** | Même module, **déjà migré en base** | `module_content_fields` (`preview_kind='cards'`, clés i18n `card.*`) | Layout générique `Cards` (web + mobile) via `ModuleRenderer` | **Construit mais court-circuité sur mobile** par l'override A ; utilisé côté web |
| **B** | Module `diet_weight_psycho` « Alimentation et psychotropes » | **En base** (`psyedu_topics`/`psyedu_blocks`, `psyedu_seed.sql`) : 9 fiches | Layout `psyedu` (`PsyEduLayout` + `PsyEduBlockRenderer`) | **Contenu seedé mais module en `coming_soon`/inactif** dans `seed.sql` — non surfacé |
| **C** | Moteur `psyedu` embarqué en onglet « Comprendre/Fiches » | **En base** | Layout `psyedu` dans un onglet `tabbed` | Vivant pour `distress_tolerance`, `craving_journal`, `chronobiology_tracker`, `cognitive_distortions` |

### Problèmes concrets

1. **Doublon de contenu** — les 5 cartes legacy sont à ~100 % redondantes avec des équivalents en base :
   | Carte legacy | Doublon |
   |---|---|
   | `card_sleep_01` (hygiène sommeil) | fiche `sleep_chrono` (B) + module `sleep_diary` |
   | `card_grounding_01` (ancrage 5-4-3-2-1) | module `grounding` |
   | `card_cbt_01` (distorsions cognitives) | module `cognitive_distortions` |
   | `card_medication_appetite_01` (appétit) | fiches `antipsychotics` / `nutrition_brain` (B) |
   | `card_medication_lithium_01` (lithium) | fiche `mood_stabilizers` (B) |

2. **Doublon de mécanisme** — deux façons de servir une fiche (`cards` en dur côté mobile vs `psyedu` en base), deux pickers web (`usePsychoEducationPicker` + `unlockPsychoeducation`/`updatePsychoeducationCards` vs le déblocage générique `unlockModule`), deux formats de config (`unlocked_cards` vs déblocage de module standard).

3. **Taxonomie confuse** — le savoir « médicaments » est éparpillé entre B (fiches psychotropes), A (cartes lithium/appétit) et les modules de **suivi** `medication_adherence` / `medication_side_effects`. Le module « Alimentation et psychotropes » contient en plus des fiches d'hygiène de vie génériques (sommeil, activité) sans lien avec les psychotropes : **le nom ment sur le contenu**.

4. **Cause structurelle racine** — `psyedu_topics.module_key` lie une fiche à **un seul module** (`unique(module_key, topic_key)`, service `fetchTopicsByModule(moduleKey)`). Réutiliser une fiche ailleurs impose de la **dupliquer**. Tant que ce 1:1 existe, les doublons reviendront.

5. **Non-conformités** — le legacy A viole i18n (textes FR en dur), config-first (contenu en TS), et les coding-standards (`PsychoeducationScreen` : `useState` pour des données, fetch en `useEffect`, ombre hardcodée).

---

## 2. Cible

> **Un fonds unique de fiches** (moteur `psyedu`), **découplé des modules**, **rangé par thème** et **tagué**, **sourcé et daté**, **relié aux outils**, surfacé dans une **bibliothèque cherchable** côté patient et un **picker unifié** côté praticien. Le legacy codé en dur disparaît.

- **Un seul module bibliothèque** : `psychoeducation` devient *la* bibliothèque « Mieux comprendre » (label patient à adoucir, cf. §6.7).
- **`diet_weight_psycho` est retiré en tant que module** (il est déjà `coming_soon`/inactif) — ses 9 fiches sont re-classées par thème dans la bibliothèque.
- **Organisation par thème clinique** (décision utilisateur 2026-06-10) :
  - 🟣 **Mon traitement** — fiches médicaments par classe (antipsychotiques, antidépresseurs, thymorégulateurs/lithium, méthylphénidate) + prise de poids/appétit/sécurité. Se marie aux modules `medication_adherence` / `medication_side_effects`.
  - 🟢 **Hygiène de vie** — sommeil/chronobiologie, alimentation-cerveau, activité douce. Se marie à `sleep_diary` / `chronobiology_tracker` / `behavioral_activation`.
  - (extensible : « Comprendre mon trouble », « Mes outils TCC/DBT »…)
- La prise de poids sous traitement (le pont psychotrope↔alimentation) → **Mon traitement**. La nutrition générale → **Hygiène de vie**. Plus de zone grise.

---

## 3. Modèle de données (découplage fiche ↔ module)

Idempotent, répercuté dans `supabase/schema.sql` (source de vérité) + `database.types.ts` (maintenu à la main).

### 3.1 Nouvelles tables

```sql
-- Thèmes de la bibliothèque (ordre + icône ; libellé via i18n psyedu.theme.<id>)
create table public.psyedu_themes (
  id          text primary key,          -- 'treatment', 'lifestyle', …
  icon_name   text not null,
  sort_order  int  not null default 0
);

-- Lien N:N module ↔ fiche (réutilisation ordonnée d'une fiche par un module)
create table public.module_topics (
  module_id   text not null references public.modules(id)       on delete cascade,
  topic_id    uuid not null references public.psyedu_topics(id) on delete cascade,
  sort_order  int  not null default 0,
  primary key (module_id, topic_id)
);

-- Tags d'une fiche (réutilise la taxonomie tags/tag_dimensions de migration_module_taxonomy.sql)
create table public.psyedu_topic_tags (
  topic_id  uuid not null references public.psyedu_topics(id) on delete cascade,
  tag_id    text not null references public.tags(id)          on delete cascade,
  primary key (topic_id, tag_id)
);
```

### 3.2 Évolution de `psyedu_topics`

```sql
alter table public.psyedu_topics add column theme_id    text references public.psyedu_themes(id);
alter table public.psyedu_topics add column reviewed_at date;   -- couche « preuve »
-- topic_key devient un identifiant global stable (la bibliothèque ne lit plus par module_key) ;
-- module_key conservé nullable le temps de la transition, puis retiré en fin de refonte.
```

- La **bibliothèque** lit par `theme_id` (groupé) et filtre par `psyedu_topic_tags`.
- L'onglet **« Comprendre »** d'un module lit via `module_topics` (fiches partagées, ordonnées) — **une seule source de vérité par fiche**.
- Nouveau service `psyeduService.fetchTopicsByTheme()` / `fetchLibrary()` ; `fetchTopicsByModule` ré-implémenté au-dessus de `module_topics`.

### 3.3 Déblocage & lecture (remplace le système `unlocked_cards`)

- Déblocage praticien : `patient_modules.config.unlocked_topics: string[]` (topic_ids) **ou** packs de thème → unifié sur le déblocage standard, suppression de `unlockPsychoeducation`/`updatePsychoeducationCards`.
- Statut de lecture : table dédiée `patient_topic_reads(patient_id, topic_id, read_at)` (factuel, conforme MDR). Remonté au praticien en « X/Y lues ».

> **RLS** : `psyedu_themes` / `module_topics` / `psyedu_topic_tags` en lecture pour tout authentifié (contenu éditorial, zéro donnée clinique). `patient_topic_reads` : patient écrit/lit les siennes, praticien lit celles de ses patients.

---

## 4. Plan par phases

> Ordre **web-puis-mobile** (le praticien doit pouvoir débloquer avant que le patient accède). **Chaque phase finit verte** : tests (`vitest`/`jest`) + `tsc -b --noEmit` (les deux apps) + doc à jour. Aucun cast/suppression.

### Phase 0 — Fondations data (non destructif) — ✅ FAIT (code, non appliqué en prod)
- ✅ Taxonomie + nouvelles tables dans `schema.sql` (source de vérité) : `tag_dimensions`, `tags`, `module_tags`, `psyedu_themes`, `module_topics`, `psyedu_topic_tags` + `alter psyedu_topics` (theme_id, reviewed_at, module_key nullable).
- ✅ Seeds tracés : `supabase/seed/taxonomy_seed.sql` + `supabase/seed/psyedu_themes_seed.sql`.
- ✅ Migration idempotente consolidée pour Studio : `supabase/migration_psyedu_refonte_p0.sql` (supersède l'ancien `migration_module_taxonomy.sql` untracked — supprimable).
- ✅ Types `@psytool/shared` : `PsyEduTheme` ajouté, `PsyEduTopic` étendu (theme_id, reviewed_at, module_key nullable).
- ✅ tsc web + mobile verts, test `PsyEduLayout` vert.
- ⏳ Reste : appliquer la migration sur Supabase (MCP) quand validé ; `database.types.ts` web (tables ajoutées au 1er usage en Phase 2).

### Phase 1 — Réorganiser le contenu existant (dédoublonnage)
**Réalité prod (≠ seeds périmés)** : la partie hygiène de vie a déjà été sortie de
`diet_weight_psycho` vers les module_keys virtuels `psyedu_sleep` (2), `psyedu_nutrition` (1),
`psyedu_activity` (1) ; `diet_weight_psycho` conserve 5 fiches médicaments.

- ✅ **Phase 1a FAITE (code + appliquée prod)** — `supabase/seed/psyedu_refonte_p1_seed.sql` :
  - thèmes : `treatment` (5 fiches médicaments), `lifestyle` (4 fiches hygiène de vie) ;
  - tags des fiches (`psyedu_topic_tags`, 44) ;
  - liens fiche↔outil (`module_topics`, 15) : fiches médicaments↔`medication_adherence`/`medication_side_effects`, sommeil↔`sleep_diary`/`chronobiology_tracker`, activité↔`behavioral_activation`.
  - `reviewed_at` laissé NULL volontairement (date de revue = responsabilité clinicien).
- ✅ **Phase 1b FAITE (validée clinicien + appliquée prod)** — i18n `fr/psyedu.json`/`fr/psyedu_teen.json` (contenu lithium désormais consolidé dans `supabase/seed/psyedu_seed.sql`, cf. Phase 5) :
  | Carte legacy | Décision | Action |
  |---|---|---|
  | Hygiène du sommeil | redondante (`psyedu_sleep`) | 🗑️ à supprimer en Phase 3 |
  | Ancrage 5-4-3-2-1 | = module `grounding` | 🗑️ à supprimer en Phase 3 |
  | Distorsions cognitives | `cog_distortions_intro` plus riche (10 distorsions + sources) | 🗑️ à supprimer en Phase 3 |
  | Traitements & appétit | stratégies déjà couvertes ; 2 nuggets uniques | ✅ fusionnés dans fiche `general` (tip6 soif, tip7 marche) |
  | Lithium : sécurité | contenu unique précieux | ✅ fiche dédiée `lithium_safety` créée (treatment, sourcée ANSM/Gitlin, FR + teen, tags, liens `medication_*`) |

  Contenu utile préservé ✅ — la suppression effective des cartes legacy se fait en Phase 3.

### Phase 2 — Bibliothèque web praticien — ✅ FAITE (code + tests verts)
- ✅ Couche service web : `fetchThemes()` + `fetchLibraryTopics()` (fiches à thème + tags) dans `psyeduService.ts` + tests.
- ✅ Picker unifié `PsychoLibraryPicker` : fiches **groupées par thème** + **recherche**, écrit `config.unlocked_topics` (`PsychoeducationTopicEntry[]`). `usePsychoEducationPicker` réécrit (topics), `unlockPsychoeducation`/`updatePsychoeducationTopics` migrés vers `unlocked_topics`. `fetchPsychoCards`/`PsychoCardInfo` supprimés.
- ✅ i18n : `psyedu.theme.{treatment,lifestyle}`, libellés « carte » → « fiche », clés recherche. tsc web vert, suite web 629 tests verts.
- ⏳ **Filtre par tags** (chips) : reporté en finition (Phase 4) — thèmes + recherche couvrent déjà l'organisation/trouvabilité.
- ⚠️ État transitoire (assumé sur la branche) : l'aperçu patient web (`ModulePreviewPanel`) et le rendu mobile lisent encore l'ancien modèle de cartes → corrigés en Phase 3. Le format `unlocked_topics` n'est lu côté patient qu'à partir de la Phase 3.

### Phase 3 — Bibliothèque mobile patient — ✅ FAITE (code + tests verts + appliquée prod)
- ✅ Nouveau `preview_kind = 'psyedu_library'` (shared `PreviewKind`). Le module psychoeducation rend désormais via le moteur générique (`ModuleContentScreen` → `LayoutDispatcher`), plus d'écran dédié.
- ✅ Layout mobile `PsyEduLibraryLayout` : lit `config.unlocked_topics`, fiches **groupées par thème**, détail via `PsyEduBlockRenderer`, **marquer comme lu** (`markTopicRead`). Helpers i18n extraits dans `PsyEdu/psyeduLocalize.ts` (réutilisés). Test dédié.
- ✅ Service mobile : `fetchTopicsByIds`, `fetchThemes`, `markTopicRead`. `ModuleContentScreen` charge `patientConfig` pour les `CONFIG_LAYOUTS`.
- ✅ Layout web `PsyEduLibraryLayout` (aperçu praticien : toutes les fiches groupées par thème).
- ✅ **Suppression du legacy** : `PsychoeducationScreen`, `CardDetailScreen`, `psychoeducationCards.ts`, `psychoeducationService` (+ tests), routes `AppStack` (`Psychoeducation`/`CardDetail`), override `MODULE_SCREEN_MAP`. (`lib/psychoeducation.ts` n'existait pas — doc périmée.)
- ✅ DB : `preview_kind` cards→psyedu_library (prod + `seed.sql`) ; **4 lignes patient migrées** `unlocked_cards`→`unlocked_topics` (`supabase/migration_psyedu_unlocked_topics.sql`, idempotent). Statut de lecture conservé dans `config.unlocked_topics[].is_read` (pas de table `patient_topic_reads` séparée — le format config suffit).
- ✅ `previewKindCoverage.test.ts` mis à jour. Web 642 + mobile 729+4 tests verts, tsc ×2 verts.
- ⏳ Reste (Phase 5) : cartes `module_content_fields` inertes + `CardsLayout` (web/mobile) désormais morts → à nettoyer.

### Phase 4 — Valeur ajoutée (littérature)
- ✅ **Filtre par facettes dans la bibliothèque** : le picker réutilise `ModuleFilterBar` + `moduleMatchesTagFilters` (indication, public, approche), restreint aux tags réellement portés par des fiches, plus recherche tokenisée.
- ✅ **« Suggérer un thème »** (décision produit 2026-06-11) : bouton dans la bibliothèque, table dédiée `theme_suggestions` (service_role, hors MDR), Edge Function `send-theme-suggestion` (auth, rate-limit, insert, email Resend vers `SUPPORT_EMAIL`), service `themeSuggestionService` + composant `ThemeSuggestionButton`. NB : on n'a PAS réutilisé `support_requests` (endpoint sécurisé, motifs fermés), une table dédiée est plus propre.
- ⏳ **Parcours thématiques** (pas encore fait, plus lourd, optionnel pour la v1) :
  - Idée : un parcours = un ensemble **ordonné et nommé** de fiches que le praticien assigne en un geste, et que le patient suit dans l'ordre (progression « étape X sur Y »). Ex. « Je démarre sous lithium » = lithium_safety, mood_stabilizers, sleep_chrono.
  - Données : table `psyedu_paths` (id, libellé i18n, thème, sort_order) + `psyedu_path_topics` (path_id, topic_id, sort_order) ; suivi de progression côté patient (réutiliser `unlocked_topics` ou un champ dédié).
  - Web praticien : choisir/assigner un parcours (débloque les fiches du parcours d'un coup). Mobile patient : rendu progression + fiche suivante.
  - Contenu : curation éditoriale des parcours types.
  - MDR : séquence **fixe**, jamais déclenchée ni adaptée par les données du patient. Affichage passif. ✅
- ⏳ **Lien lecture vers outil** : CTA neutre « Ouvrir l'outil » en pied de fiche (les liens existent déjà dans `module_topics`), et entrée « Comprendre » depuis un module. Statique, jamais conditionnel aux données.
- ⏳ **Bloc « L'essentiel »** (3 puces) en tête de fiche, variantes teen.

### Hors périmètre — reporté (décision produit 2026-06-11)
- **Éditeur de fiche par le praticien (« créer ma propre fiche »)** : volontairement reporté à après stabilisation de l'app. C'est un *deuxième modèle de contenu* (texte libre monolingue vs clés i18n + variante ado) qui mérite d'être traité comme une feature à part entière, pas bolté sur la refonte. Garde-fous à prévoir le jour venu : classe de contenu séparée et stockage distinct (≠ `psyedu_blocks`), provenance étiquetée « Note de votre praticien » jamais mélangée aux fiches Kær sourcées, responsabilité du contenu portée par le praticien (CGU) — Kær = canal, pas éditeur. **Aucune anticipation dans le schéma pour l'instant** (pas de colonne spéculative).

### Phase 5 — Nettoyage, doc, parité, merge
- ✅ **Consolidation des seeds psyedu (2026-06-13)** — seeds régénérés depuis la prod (source de vérité), divergences éliminées :
  - `psyedu_seed.sql` réécrit : 11 fiches avec les **bons `module_key`** (psyedu_sleep/nutrition/activity + diet_weight_psycho + cognitive_distortions), `theme_id` inclus, blocs action-first ; `sleep_hygiene_rules` et `lithium_safety` désormais **présents** ; `DELETE` couvre les 5 module_keys.
  - `psyedu_refonte_p1_seed.sql` réécrit : tags des fiches + liens `module_topics` complets (idempotents).
  - **Supprimés** (absorbés/obsolètes) : `psyedu_lithium_seed.sql`, `psyedu_migrate_module_keys.sql`.
  - Ordre d'exécution documenté en tête de `psyedu_seed.sql` (themes → tags → topics/blocs → p1). Validé en transaction annulée (prod intacte).
- ⏳ Reste : retirer `module_key` de `psyedu_topics` (le jour où la biblio ne lit plus par module_key) ; nettoyer cartes `module_content_fields` inertes + `CardsLayout` mort ; mettre à jour `docs/module-engine.md` + design-system docs.
- Procédure `.claude/rules/merge-procedure.md` avant tout merge.

---

## 5. Garde-fous MDR (RÈGLE D'OR)

- Fiches = **affichage passif** de savoir neutre. ✅
- Statut lu/non-lu, « X/Y lues » = **fait d'usage**, pas une interprétation clinique. ✅
- **Personnalisation = curation humaine du praticien**, JAMAIS recommandation automatique du moteur basée sur les données du patient. ❌ interdit.
- Liens fiche→outil et parcours = **statiques**, jamais déclenchés par une saisie/seuil. ✅

---

## 6. Risques & points de vigilance

1. **Patients existants** avec `config.unlocked_cards` → script de migration vers `unlocked_topics` (mapping card_id → topic_id), idempotent, avant suppression du legacy.
2. **Parité web ≡ mobile** : la bibliothèque doit exister des deux côtés avant de retirer le legacy mobile.
3. **`database.types.ts` manuel** : ajouter chaque nouvelle table sinon `supabase.from()` est typé `never`.
4. **Taxonomy untracked** : `migration_module_taxonomy.sql` n'est pas committé — l'intégrer en Phase 0, ne pas le perdre.
5. **Tests web depuis `apps/web`** (jamais la racine).
