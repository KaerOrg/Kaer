# Module — Colonnes de Beck (`beck_columns`)

## Base clinique

**Référence :** Beck, A.T., Rush, A.J., Shaw, B.F., & Emery, G. (1979). *Cognitive Therapy of Depression*. Guilford Press.

Les Colonnes de Beck, également appelées *Dysfunctional Thought Record* (DTR), sont l'outil de restructuration cognitive fondateur de la TCC. Leur efficacité est documentée dans de nombreuses méta-analyses (Hofmann et al., 2012 ; Cuijpers et al., 2019) pour la dépression unipolaire, les troubles anxieux, le PTSD et l'insomnie chronique. Recommandées par la HAS, le NICE et l'APA.

**Version implémentée : 6 colonnes standard + 2 colonnes « preuves » optionnelles**

| # | Colonne | Ce que le patient renseigne |
|---|---|---|
| 1 | Situation | Contexte déclencheur (qui, quoi, quand, où) |
| 2 | Émotion(s) | Nom libre + chips d'aide au vocabulaire + intensité initiale (0 à 100) |
| 3 | Pensée automatique | Contenu + conviction initiale (0 à 100) |
| 4 | Distorsion cognitive (facultative) | Piège de pensée auto-étiqueté par le patient : texte libre + chips des 8 pièges classiques (Burns) |
| (5) | Preuves pour la pensée (groupe optionnel `evidence`) | Faits concrets soutenant la pensée |
| (6) | Preuves contre la pensée (groupe optionnel `evidence`) | Faits contredisant la pensée |
| 5/7 | Réponse rationnelle | Pensée alternative construite par le patient |
| 6/8 | Résultat | **Ré-évaluation de l'émotion de départ** (intensité maintenant, 0 à 100 : la mesure avant/après du DTR) + nouvelles émotions éventuelles (texte libre optionnel) + conviction en la PA (0 à 100) |

> Choix clinique (2026-07) : la colonne Résultat ré-évalue la **même** émotion
> qu'en colonne 2 (protocole Beck/Padesky), ce qui rend `emotion_intensity` et
> `outcome_intensity` directement comparables dans la courbe praticien. La
> conviction mesurée est celle dans la pensée **alternative** (variante Padesky),
> pas la re-cotation de la pensée automatique initiale.

La numérotation affichée est **dynamique** : position parmi les colonnes visibles.

**Examen des preuves, format 7 colonnes de Padesky (2026-07, optionnel)** : les deux
colonnes « preuves » (`optional_group='evidence'`) sont masquées par défaut ; le
praticien les active **par patient** via la bascule « Examen des preuves » de la
card Beck (`patient_modules.config.enabled_groups`, helper partagé
`readEnabledGroups`). Référence : Greenberger & Padesky, *Mind Over Mood*
(examiner les preuves avant de construire la pensée alternative).

**Saisie assistée (2026-07)** : les colonnes Émotion et Distorsion portent des
chips de suggestions (`suggestion_1..n` sur le `column_text_field`, codes i18n
en seed). Une chip ajoute/retire son mot dans le champ ; le texte libre reste
roi. Conformité MDR : auto-étiquetage par le patient, aucune détection ni
suggestion conditionnelle aux données. La liste des pièges est alignée sur les
fiches psyedu du module `cognitive_distortions` (ressource pédagogique sœur),
sans couplage technique.

---

## Conformité MDR 2017/745

Kær est un Carnet de Bord Numérique, non-Dispositif Médical.

**Règle appliquée :** le code affiche, jamais il ne conclut.

- Les intensités et convictions (0 à 100) sont des **chiffres bruts** saisis par le patient, affichés tels quels, sans label interprétatif (ni couleur, ni mention « sévère », « modéré », etc.).
- **Les curseurs ne sont pas pré-positionnés** : aucune valeur n'est enregistrée tant que le patient n'a pas touché le curseur (pas de faux « 50 » d'ancrage dans les données ni dans les courbes praticien).
- Aucun seuil ne déclenche une action ou une notification. La puce « À compléter » est un statut de workflow dérivé (fiche sans réponse rationnelle), pas une interprétation.
- L'historique est une liste neutre antichronologique ; l'interprétation appartient exclusivement au patient et au soignant en consultation.

---

## Architecture technique

Le module est rendu par le **moteur générique `column_form`** (zéro écran dédié) :
tout le contenu (colonnes, hints, placeholders, chips, validation, capture rapide)
vit en base dans `module_content_fields` + `field_props` (seed `supabase/seed.sql`,
section `beck_columns`). Détail du contrat : [`docs/module-engine.md`](../module-engine.md)
§ Layout `column_form`.

### Stockage & synchronisation

- **Offline-first** : chaque fiche = une ligne `form_entries` SQLite
  (`values` JSON indexé par clé logique : `situation`, `emotion`,
  `emotion_intensity`, `automatic_thought`, `thought_belief`, `distortion`,
  `evidence_for`, `evidence_against`, `rational_response`, `outcome_emotion`,
  `outcome_intensity`, `outcome_belief`).
- **Synchronisation** : `formEntryService.saveFormEntry` passe par
  `syncHelpers.syncUpsert` → `patient_entries` (payload `{ module_id, values }`,
  `entry_kind='form_entry'`), sous gate de consentement `patients.share_consent`.
- **Migration legacy** : l'ancienne table `beck_thought_records` est migrée vers
  `form_entries` au démarrage (`INSERT OR IGNORE`, cf. `apps/mobile/src/lib/database.ts`).

### Parcours patient (mobile)

- **Capture en deux temps (2026-07)** : bouton secondaire « Noter vite »
  (formulaire réduit aux `quick_key_*` : situation + pensée automatique). Une
  fiche sans réponse rationnelle (`complete_key_*`) porte une puce « À
  compléter » qui rouvre l'édition complète, pour terminer plus tard ou en séance.
- **Fiche dépliable** : en liste, un appui sur une fiche déplie le détail
  (textes intégraux + chaque curseur renseigné avec son libellé et sa valeur brute).
- Édition et suppression (avec confirmation) sur chaque fiche.

### Vue praticien (web)

Le panneau « Données » de la card Beck (`PatientPage`) restitue les fiches
synchronisées : courbes brutes de tous les curseurs (`ColumnFormDataPanel`,
pattern `fear_thermometer`) + fiches complètes antichronologiques paginées.
Circuit : `fetchFormEntries` → `engagementQueries.moduleData` (kind `'form'`).
La card porte aussi la bascule « Examen des preuves » (`ColumnFormOptionsRow`).
L'aperçu (`ModulePreviewPanel`) reflète le formulaire, chips et boutons inclus,
avec badge « Option » sur les colonnes optionnelles.

### Fichiers

| Fichier | Rôle |
|---|---|
| `apps/mobile/.../layouts/ColumnForm/ColumnFormLayout.tsx` | Layout générique : liste, saisie, capture rapide, chips, groupes optionnels |
| `apps/mobile/.../layouts/ColumnForm/{entryCompletion,textSuggestions}.ts` | Helpers purs (statut « à compléter », toggle des chips) |
| `apps/mobile/src/services/formEntryService.ts` | Persistance + sync (`syncUpsert`/`syncDelete`) |
| `apps/web/.../layouts/ColumnFormLayout/ColumnFormLayout.tsx` | Aperçu praticien |
| `apps/web/src/pages/PatientPage/tabs/ColumnFormDataPanel.tsx` | Panneau Données praticien (fiches + courbes) |
| `apps/web/src/pages/PatientPage/tabs/ColumnFormOptionsRow.tsx` | Bascule des groupes optionnels (`enabled_groups`) |
| `packages/shared/src/services/patientModuleConfig.ts` | `readEnabledGroups` (contrat partagé web ≡ mobile) |
| `supabase/seed.sql` § beck_columns | Source de vérité du contenu (colonnes, props, i18n codes) |

---

## Navigation mobile

```
HomeScreen
  └── ModuleContent { moduleType: 'beck_columns' }   → moteur column_form
        ├── mode liste   (fiches dépliables, puce « à compléter »)
        ├── mode entry   (formulaire complet, colonnes visibles selon config)
        └── mode quick   (capture rapide : situation + pensée automatique)
```

---

## Tests

- `apps/mobile/.../FieldRenderer.column_form.test.tsx` : 24 tests (liste, saisie,
  édition, suppression, validation, capture rapide, puce « à compléter », chips
  de suggestions, colonnes optionnelles, curseurs sans pré-sélection, fiche dépliable)
- `apps/mobile/.../ColumnForm/entryCompletion.test.ts` + `textSuggestions.test.ts` : helpers purs
- `packages/shared/src/services/patientModuleConfig.test.ts` : `readEnabledGroups`
- `apps/web/.../ColumnFormDataPanel.test.tsx` + `columnFormData.test.ts` : panneau Données (dont test de conformité MDR)
- `apps/web/.../ColumnFormOptionsRow.test.tsx` : bascule praticien
- `apps/web/src/services/engagementService.test.ts` (`fetchFormEntries`) et `moduleAssignmentService.test.ts` (`updateEnabledGroups`)

```bash
cd apps/mobile && npx jest FieldRenderer.column_form
cd apps/web    && npx vitest run src/pages/PatientPage/tabs
```
