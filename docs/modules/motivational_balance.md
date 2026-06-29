# Module : Balance motivationnelle (`motivational_balance`)

## Statut

Implémenté — branche `EM`

## Description clinique

Outil d'Entretien Motivationnel (EM) basé sur le modèle de Miller & Rollnick (2013). Aide le patient à explorer son ambivalence face au changement via 4 composantes complémentaires, toutes à remplir en consultation avec le soignant.

**Bases scientifiques :**
- Miller WR & Rollnick S (2013) — *Motivational Interviewing*, 3e éd. — [PubMed](https://pubmed.ncbi.nlm.nih.gov/22547733/)
- Prochaska JO & DiClemente CC (1983) — Transtheoretical Model — [PubMed](https://pubmed.ncbi.nlm.nih.gov/6863699/)
- Deci EL & Ryan RM (2000) — Self-Determination Theory — [PubMed](https://pubmed.ncbi.nlm.nih.gov/11392867/)
- HAS (2014) — Mésusage de substances
- NICE PH49 (2014) — Behaviour change

---

## Architecture

> **Refonte (issue #18)** : le module est passé d'un écran custom 1042 lignes
> (`MotivationalBalanceScreen`) au moteur générique `ModuleContentScreen` + layout
> `tabbed`. Plus aucune route custom : chaque onglet est un sous-layout réutilisable
> dispatché par `FieldRenderer`.

### Layouts (rendus par le moteur générique)

| `sub_preview_kind` | Layout mobile | Layout web (aperçu) | Rôle |
|---|---|---|---|
| `psyedu` | `PsyEdu` | `PsyEduLayout` | Onglet Fiches (lit `psyedu_topics`) |
| `stage_wheel` | `StageWheel/` | `StageWheelLayout` | Onglet Stade — sélecteur Prochaska + historique |
| `dual_ruler` | `DualRuler/` | `DualRulerLayout` | Onglet Thermomètres — deux échelles 0-10 + historique |
| `weighted_balance` | `WeightedBalance/` | `WeightedBalanceLayout` | Onglet Balance — valeurs + Pour/Contre pondérés |

Les onglets Stade / Thermomètres / Balance lisent et écrivent leur état SQLite via
`motivationalBalanceService` ; le web rend un aperçu structurel statique (les vraies
données patient passent par l'onglet « Données » du praticien). Tests co-localisés
dans chaque dossier de layout (mobile + web).

### Service

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/services/motivationalBalanceService.ts` | CRUD SQLite : rulers, balance items, values |

### Base de données locale (SQLite)

**`em_rulers`** — une ligne par séance de consultation
| Colonne | Type | Description |
|---|---|---|
| id | TEXT PK | UUID |
| behavior_target | TEXT | Comportement exploré (ex : arrêter de fumer) |
| stage | INTEGER | Stade Prochaska 1–6 (si saisi via onglet Stade) |
| importance_score | INTEGER | 0–10 |
| importance_why | TEXT | Réponse à "Pourquoi ce score ?" |
| confidence_score | INTEGER | 0–10 |
| confidence_why | TEXT | Réponse à "Qu'est-ce qui vous rendrait plus confiant ?" |
| commitment_text | TEXT | Phrase d'engagement de séance |
| created_at | TEXT | ISO 8601 |

**`em_balance_items`** — items de la balance (permanents)
| Colonne | Type | Description |
|---|---|---|
| id | TEXT PK | UUID |
| behavior_target | TEXT | Comportement de référence |
| side | TEXT | `'for'` ou `'against'` |
| text | TEXT | Contenu de l'argument |
| weight | INTEGER | 1 (faible) / 2 (moyen) / 3 (fort) |
| sort_order | INTEGER | Position dans la colonne |

**`em_values`** — valeurs sélectionnées (état persistant, max 3)
| Colonne | Type | Description |
|---|---|---|
| id | TEXT PK | `val_<value_key>` |
| value_key | TEXT UNIQUE | Clé i18n (ex : `family`, `health`) |
| sort_order | INTEGER | Ordre de sélection |

### Supabase

- Catégorie : `motivation` (sort_order 8, nouveau dans `seed.sql`)
- `preview_kind` : `tabbed` ; fields `tab` seedés dans `seed.sql` (`mb.tab.*`) avec `sub_preview_kind` par onglet ; valeurs de la balance dans `mb.balance.cfg` (`value_1..12`, `max_values`)
- Psyedu : 4 topics (`em_seed.sql`), blocs i18n dans `fr/psyedu.json`

---

## Onglets

### 1. Fiches
4 fiches psychoéducatives (contenu Supabase) :
- **Comprendre l'ambivalence** — vouloir et ne pas vouloir, normalisation
- **Les stades du changement** — roue Prochaska avec les 6 stades listés
- **Mes valeurs, moteur du changement** — SDT, motivation autonome vs. contrôlée
- **Parler du changement** — change talk, DARN-CAT, discours mobilisateur

### 2. Stade (`stage_wheel`)
- 6 cartes `ui/Card` représentant les stades de Prochaska, sélection exclusive
- Sélection → bouton `ui/Button` "Enregistrer la séance"
- Historique des stades avec date + suppression (confirmation `ConfirmDialog`)

### 3. Thermomètres (`dual_ruler`)
- Champ texte (`ui/InputField`) : comportement exploré
- **Importance** (0–10) : `RatingSelector` (variante `numbered`) + justification "Pourquoi ce score ?"
- **Confiance** (0–10) : `RatingSelector` + justification "Qu'est-ce qui vous rendrait plus confiant ?"
- Phrase d'engagement (texte libre)
- Historique des séances avec scores + engagement archivé

### 4. Balance (`weighted_balance`)
- Sélecteur de valeurs (`ui/Chip`, liste et max lus de `mb.balance.cfg`)
- 2 colonnes : **Pour changer** / **Contre changer**
- Ajout d'items libres + pondération 1–3 via `RatingSelector` (variante `track`, monochrome — pas de couleur de gravité)
- Suppression d'items (confirmation `ConfirmDialog`)

> Les sources scientifiques (Miller & Rollnick, Prochaska, Deci & Ryan, HAS, NICE)
> ne sont plus dans une modale custom : elles vivent dans la table `module_sources`
> (déjà affichées au praticien côté web via `ModuleSourcesPanel`). Un affichage
> patient mobile générique est suivi dans l'issue #86.

---

## Conformité MDR 2017/745

- Aucun score interprété automatiquement — les valeurs brutes (0–10) sont affichées sans label, couleur interprétative ni seuil
- L'interprétation appartient exclusivement au soignant en consultation
- Données stockées en SQLite local puis répliquées vers `patient_entries` via `syncUpsert`/`syncDelete` **après opt-in** (`share_consent`) — stockées, jamais interprétées par le serveur
- Le module n'émet aucune notification conditionnelle aux données

---

## Navigation

```
HomeScreen → ModuleContent { moduleType: 'motivational_balance' }
           → preview_kind 'tabbed' → onglets Fiches / Stade / Thermomètres / Balance
```

Plus de route custom (`MotivationalBalance` / `MotivationalBalanceDetail` retirées
de `AppStack` et `CUSTOM_ROUTES`). Le détail des fiches passe par le flux générique
`PsyEduLayout`.

## I18n

| Namespace | Fichier |
|---|---|
| Textes module | `fr/common.json`, `en/common.json` sous `modules.motivational_balance` |
| Teen mode | `fr/teen.json`, `en/teen.json` sous `modules.motivational_balance` |
| Fiches psyedu | `fr/psyedu.json` sous `motivational_balance` |

## Teen mode

- `useTeen()` + `TeenAccent` intégrés
- Couleur accent depuis `teenColor('motivational_balance')`
- Textes tutoiement dans `fr/teen.json` + `en/teen.json`
- `DisclaimerBanner` avec variante teen
