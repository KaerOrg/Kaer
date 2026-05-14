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

### Écrans

| Fichier | Rôle |
|---|---|
| `apps/mobile/src/screens/modules/MotivationalBalanceScreen.tsx` | Écran principal — 4 onglets |
| `apps/mobile/src/screens/modules/MotivationalBalanceDetailScreen.tsx` | Détail d'une fiche psyedu |
| `apps/mobile/src/screens/modules/MotivationalBalanceScreen.test.tsx` | 10 tests Jest |

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
- `preview_kind` : `tabbed` (déclaré en base, rendu par écran custom)
- Psyedu : 4 topics (`em_seed.sql`), blocs i18n dans `fr/psyedu.json`

---

## Onglets

### 1. Fiches
4 fiches psychoéducatives (contenu Supabase) :
- **Comprendre l'ambivalence** — vouloir et ne pas vouloir, normalisation
- **Les stades du changement** — roue Prochaska avec les 6 stades listés
- **Mes valeurs, moteur du changement** — SDT, motivation autonome vs. contrôlée
- **Parler du changement** — change talk, DARN-CAT, discours mobilisateur

### 2. Stade
- 6 cartes (Pressable) représentant les stades de Prochaska
- Sélection → bouton "Enregistrer la séance"
- Historique des stades avec date + suppression

### 3. Thermomètres
- Champ texte : comportement exploré
- **Importance** (0–10) : pip slider + question de suivi "Pourquoi ce score ?"
- **Confiance** (0–10) : pip slider + question de suivi "Qu'est-ce qui vous rendrait plus confiant ?"
- Phrase d'engagement (texte libre)
- Historique des séances avec scores + engagement archivé

### 4. Balance
- Sélecteur de valeurs (12 valeurs, max 3 sélectionnables)
- 2 colonnes : **Pour changer** / **Contre changer**
- Ajout d'items libres + pondération 1–3 (3 points colorés)
- Suppression d'items

---

## Bouton "i" — Sources

Bouton `Info` dans le header (via `navigation.setOptions({ headerRight })`) ouvre un bottom sheet Modal avec :
- Miller & Rollnick (2013)
- Prochaska & DiClemente (1983)
- Deci & Ryan (2000 — SDT)
- HAS (2014)
- NICE PH49 (2014)

Disponible sur tous les onglets.

---

## Conformité MDR 2017/745

- Aucun score interprété automatiquement — les valeurs brutes (0–10) sont affichées sans label, couleur interprétative ni seuil
- L'interprétation appartient exclusivement au soignant en consultation
- Aucune donnée n'est envoyée à Supabase (100% local SQLite)
- Le module n'émet aucune notification conditionnelle aux données

---

## Navigation

```
AppStack → MotivationalBalance (custom route)
         → MotivationalBalanceDetail (topicId, topicKey)
```

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
