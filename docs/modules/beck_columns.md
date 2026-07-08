# Module — Colonnes de Beck (`beck_columns`)

## Base clinique

**Référence :** Beck, A.T., Rush, A.J., Shaw, B.F., & Emery, G. (1979). *Cognitive Therapy of Depression*. Guilford Press.

Les Colonnes de Beck, également appelées *Dysfunctional Thought Record* (DTR), sont l'outil de restructuration cognitive fondateur de la TCC. Leur efficacité est documentée dans de nombreuses méta-analyses (Hofmann et al., 2012 ; Cuijpers et al., 2019) pour la dépression unipolaire, les troubles anxieux, le PTSD et l'insomnie chronique. Recommandées par la HAS, le NICE et l'APA.

**Version implémentée : 7 colonnes (format complet de Padesky)**

| # | Colonne | Ce que le patient renseigne |
|---|---|---|
| 1 | Situation | Contexte déclencheur (qui, quoi, quand, où) |
| 2 | Émotion(s) | Nom libre + chips d'aide au vocabulaire + intensité initiale (0 à 100) |
| 3 | Pensée automatique | Contenu + conviction initiale (0 à 100) |
| 4 | Preuves pour la pensée (facultative) | Faits concrets soutenant la pensée |
| 5 | Preuves contre la pensée (facultative) | Faits contredisant la pensée |
| 6 | Réponse rationnelle | Pensée alternative construite par le patient |
| 7 | Résultat | **Ré-évaluation de l'émotion de départ** (intensité maintenant, 0 à 100 : la mesure avant/après du DTR) + nouvelles émotions éventuelles (texte libre optionnel) + conviction en la PA (0 à 100) |

> Colonne « Distorsion cognitive » retirée (2026-07, #117) : le piège de pensée
> auto-étiqueté alourdissait la saisie sans bénéfice clinique clair. La
> restructuration passe désormais directement de la pensée automatique à l'examen
> des preuves.

> Choix clinique (2026-07) : la colonne Résultat ré-évalue la **même** émotion
> qu'en colonne 2 (protocole Beck/Padesky), ce qui rend `emotion_intensity` et
> `outcome_intensity` directement comparables dans la courbe praticien. La
> conviction mesurée est celle dans la pensée **alternative** (variante Padesky),
> pas la re-cotation de la pensée automatique initiale.

La numérotation affichée est **dynamique** : position parmi les colonnes visibles
(en capture rapide, seules 2 colonnes apparaissent).

**Examen des preuves (2026-07)** : les colonnes « preuves » suivent Greenberger &
Padesky, *Mind Over Mood* (examiner les preuves avant de construire la pensée
alternative). D'abord livrées derrière une bascule praticien par patient
(`optional_group`), elles sont devenues **standard** sur décision utilisateur :
facultatives à remplir, la validation n'exige toujours que situation ou pensée
automatique, et la « Note rapide » reste le parcours court. Le mécanisme
`optional_group` reste disponible dans le moteur (dormant).

**Saisie assistée (2026-07)** : la colonne Émotion porte des chips de suggestions
(`suggestion_1..n` sur le `column_text_field`, codes i18n en seed). Une chip
ajoute/retire son mot dans le champ ; le texte libre reste roi. Conformité MDR :
auto-étiquetage par le patient, aucune détection ni suggestion conditionnelle aux
données.

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
  `emotion_intensity`, `automatic_thought`, `thought_belief`,
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

L'onglet **Évolution** du patient affiche la courbe « intensité émotionnelle
avant / après restructuration » (`fetchBeckEvolution` : `emotion_intensity` vs
`outcome_intensity`, même émotion ré-évaluée), aux côtés des SUDS et des échelles.

Le panneau « Données » de la card Beck (`PatientPage`) est une vue **maître-détail**
pensée pour l'écran large (`ColumnFormDataPanel`) :

- **Liste latérale** (`ColumnFormEntryList`) : une ligne par saisie (antichronologique),
  date courte + libellé d'émotion et mouvement d'intensité brut (« Anxiété 80→40 »).
- **Détail** (`ColumnFormRecordDetail`) : en-tête daté en toutes lettres (locale) +
  navigation saisie précédente / suivante ; deux cartes du **mouvement de
  restructuration** avant→après : intensité (`emotion_intensity`→`outcome_intensity`)
  et croyance (`thought_belief`→`outcome_belief`), avec la différence brute ; puis
  grille responsive des colonnes restituant le **texte intégral du patient**, titres et
  couleurs dérivés de la config (`buildColumnSpecs`). Les curseurs déjà portés par les
  cartes (`SUMMARIZED_KEYS`) ne sont pas répétés dans la grille.

Le signal clinique du DTR (paires de curseurs, clé d'émotion) est décrit par
`BECK_MOVEMENTS` / `BECK_EMOTION_KEY` (`columnFormData.ts`), même connaissance métier que
`fetchBeckEvolution`. Circuit : `fetchFormEntries` → `engagementQueries.moduleData`
(kind `'form'`). **Conformité MDR** : valeurs brutes, delta = simple différence
arithmétique (score pour le praticien), aucun seuil ni couleur de jugement : les
couleurs codent l'identité de colonne (config).

L'aperçu (`ModulePreviewPanel`) reflète le formulaire, chips et boutons inclus.

### Fichiers

| Fichier | Rôle |
|---|---|
| `apps/mobile/.../layouts/ColumnForm/ColumnFormLayout.tsx` | Layout générique : liste, saisie, capture rapide, chips, groupes optionnels |
| `apps/mobile/.../layouts/ColumnForm/{entryCompletion,textSuggestions}.ts` | Helpers purs (statut « à compléter », toggle des chips) |
| `apps/mobile/src/services/formEntryService.ts` | Persistance + sync (`syncUpsert`/`syncDelete`) |
| `apps/web/.../layouts/ColumnFormLayout/ColumnFormLayout.tsx` | Aperçu praticien |
| `apps/web/src/pages/PatientPage/tabs/ColumnFormDataPanel.tsx` | Panneau Données praticien (vue maître-détail) |
| `apps/web/src/pages/PatientPage/tabs/ColumnFormEntryList.tsx` | Liste latérale des saisies (sélection) |
| `apps/web/src/pages/PatientPage/tabs/ColumnFormEntryItem.tsx` | Ligne de saisie (date + émotion + mouvement) |
| `apps/web/src/pages/PatientPage/tabs/ColumnFormRecordDetail.tsx` | Détail d'une saisie (mouvement + colonnes) |
| `apps/web/src/pages/PatientPage/tabs/columnFormData.ts` | Helpers purs (colonnes, mouvements Beck, dates) |
| `packages/shared/src/services/patientModuleConfig.ts` | `readEnabledGroups` (mécanisme `optional_group`, dormant) |
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
- `apps/web/.../ColumnFormDataPanel.test.tsx` : panneau Données maître-détail (liste, sélection, MDR)
- `apps/web/.../ColumnFormEntryList.test.tsx` : liste latérale (rendu, sélection, mouvement)
- `apps/web/.../ColumnFormRecordDetail.test.tsx` : détail (cartes de mouvement, colonnes, navigation, MDR)
- `apps/web/.../columnFormData.test.ts` : helpers purs (colonnes, mouvements Beck, dates)
- `apps/web/src/services/engagementService.test.ts` : `fetchFormEntries` + `fetchBeckEvolution`

```bash
cd apps/mobile && npx jest FieldRenderer.column_form
cd apps/web    && npx vitest run src/pages/PatientPage/tabs
```
