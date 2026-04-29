# Spécifications — Extension du module `diet_weight_psycho`
## Trois nouvelles fiches psychoéducatives : Sommeil · Alimentation · Activité physique

**Version :** 1.0 — Prêt pour développement
**Auteur :** Olivier Teil (IPA)
**Statut :** Validé — toutes les questions résolues

---

## Historique des versions

| Version | Résumé |
|---|---|
| 0.1 | Première rédaction — contenu local, Markdown |
| 0.2 | Révision architecturale majeure — base de données, blocs structurés, Lucide |
| **1.0** | Toutes les questions de clarification résolues — prêt pour développement |

---

## Décisions définitives

| # | Question | Décision |
|---|---|---|
| Q1 | Tonalité | **Vouvoiement en mode adulte, tutoiement en mode ado** — via double namespace i18n avec fallback (voir §3) |
| Q2 | Ordre de la liste | **SectionList à 2 sections** — "Hygiène de vie" en premier, "Médicaments & alimentation" ensuite |
| Q3 | Migration des 5 fiches existantes | **Contenu conservé à l'identique** — découpé en blocs sans révision éditoriale |
| Q4 | Mode ado | **Oui** — `TeenAccent` + namespace `psyedu_teen` avec textes en tutoiement |
| Q5 | Documentation | **Mise à jour de `docs/module-diet-weight-psycho.md`** — la spec est archivée une fois livrée |

---

## 1. Contexte et périmètre

### Ce que cette livraison produit

1. **2 nouvelles tables SQL** — `psyedu_topics` et `psyedu_blocks` (+ RLS + seed)
2. **Migration** des 5 fiches existantes vers la base de données
3. **3 nouvelles fiches** — `sleep_chrono`, `nutrition_brain`, `gentle_activity`
4. **1 service** — `psyeduService.ts` (fetch + cache MMKV)
5. **2 composants** — `<PsyEduBlockRenderer>` et `<InlineText>`
6. **Support mode ado** — namespace i18n `psyedu_teen` + `TeenAccent` dans les écrans
7. **Suppression** de `dietWeightPsychoContent.ts` et de `react-native-markdown-display`
8. **Mise à jour** de `docs/module-diet-weight-psycho.md`

### Fiches au total

| ID | Titre | Statut |
|---|---|---|
| `general` | Psychotropes et alimentation | Existant → migré |
| `antipsychotics` | Antipsychotiques et poids | Existant → migré |
| `methylphenidate` | Méthylphénidate et appétit | Existant → migré |
| `antidepressants` | ISRS et antidépresseurs | Existant → migré |
| `mood_stabilizers` | Thymorégulateurs | Existant → migré |
| `sleep_chrono` | Le sommeil et la récupération | **Nouveau** |
| `nutrition_brain` | L'alimentation et le cerveau | **Nouveau** |
| `gentle_activity` | L'activité physique douce | **Nouveau** |

### Ce que cette spec ne change PAS

- Architecture des écrans (`DietWeightPsychoScreen`, `DietWeightPsychoDetailScreen`) — adaptés, pas réécrits
- Navigation `AppStack.tsx`
- Module côté web praticien (`PatientPage.tsx`) — déjà en catégorie Hygiène de Vie
- Schéma SQL des autres tables
- Conformité MDR 2017/745 — aucun score, aucun seuil, aucune alerte

---

## 2. Conformité MDR 2017/745

> **Règle d'or, non négociable, appliquée à chaque ligne de contenu.**

Ces fiches **affichent** des informations générales validées par des recommandations officielles. Elles **n'interprètent rien** et ne déclenchent aucune action automatique.

| Interdit | Reformulation conforme |
|---|---|
| "Si vous dormez moins de 6h, consultez votre médecin" | "En cas de trouble du sommeil persistant, votre soignant peut vous orienter" |
| "Buvez 2 L si vous prenez du lithium" | "L'hydratation régulière est recommandée — votre médecin précise les besoins selon votre traitement" |
| Score + label interprétatif | *(non applicable — pas de score dans ces fiches)* |

---

## 3. Modèle de données

### Table 1 — `psyedu_topics`

```sql
CREATE TABLE psyedu_topics (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key   text        NOT NULL,
  topic_key    text        NOT NULL,
  icon_name    text        NOT NULL,         -- Lucide PascalCase : 'Moon', 'Apple', etc.
  sort_order   int         NOT NULL DEFAULT 0,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),

  UNIQUE (module_key, topic_key)
);
```

### Table 2 — `psyedu_blocks`

```sql
CREATE TABLE psyedu_blocks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id     uuid        NOT NULL REFERENCES psyedu_topics(id) ON DELETE CASCADE,
  section_key  text        NOT NULL,         -- 'why' | 'how' | 'sources'
  block_type   text        NOT NULL,         -- voir tableau ci-dessous
  text_code    text,                         -- clé i18n du texte principal
  items_codes  text[],                       -- clés i18n pour les listes à puces
  href         text,                         -- URL externe (source_link uniquement)
  sort_order   int         NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

### Types de blocs

| `block_type` | Rendu mobile | Champs utilisés |
|---|---|---|
| `heading` | `<Text style={h2}>` | `text_code` |
| `paragraph` | `<InlineText>` (gras inline) | `text_code` |
| `bullet_list` | Liste à puces | `items_codes[]` |
| `tip` | Encart coloré arrondi | `text_code` |
| `blockquote` | Bande gauche colorée | `text_code` |
| `source_link` | `<Pressable>` → `Linking.openURL` | `text_code` (label) + `href` (URL) |

### RLS

```sql
-- Lecture : tout utilisateur authentifié (contenu éditorial global)
ALTER TABLE psyedu_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE psyedu_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY psyedu_topics_authenticated_select ON psyedu_topics
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY psyedu_blocks_authenticated_select ON psyedu_blocks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM psyedu_topics t
    WHERE t.id = topic_id AND t.is_active = true
  ));

-- Écriture : service_role uniquement (migrations, seed)
```

---

## 4. Architecture i18n — Vouvoiement adulte + tutoiement ado

### Principe : double namespace avec fallback

La base stocke un seul `text_code` par bloc (ex : `psyedu.diet_weight_psycho.sleep_chrono.why.p1`). La base ne sait rien du mode ado.

Dans l'app, le composant `<InlineText>` résout la clé ainsi :

```
isTeenMode = true  → cherche psyedu_teen.<...> en premier
                     → si absent, se rabat sur psyedu.<...>
isTeenMode = false → cherche directement psyedu.<...>
```

**Avantage :** seules les phrases qui changent réellement ont besoin d'une variante teen. Les blockquotes sources, les titres de sections et les liens n'ont pas besoin de doublons.

### Structure des fichiers i18n

```
apps/mobile/src/i18n/locales/fr/
├── psyedu.json        ← textes adultes (vouvoiement) — toutes les fiches
└── psyedu_teen.json   ← surcharges ado (tutoiement) — uniquement les phrases qui changent
```

### Convention de nommage des clés

```
psyedu.<module_key>.<topic_key>.title          → titre de la fiche (liste)
psyedu.<module_key>.<topic_key>.summary        → résumé (liste)
psyedu.<module_key>.<topic_key>.<section_key>.<id>   → texte d'un bloc

psyedu.section.why     → "Pourquoi c'est important"   (clé générique, tous modules)
psyedu.section.how     → "Comment faire concrètement"
psyedu.section.sources → "Pour aller plus loin"
```

### Exemple concret

```json
// psyedu.json (adulte)
{
  "psyedu": {
    "section": {
      "why": "Pourquoi c'est important",
      "how": "Comment faire concrètement",
      "sources": "Pour aller plus loin"
    },
    "diet_weight_psycho": {
      "sleep_chrono": {
        "title": "Le sommeil et la récupération",
        "summary": "Chronobiologie, écrans et rythmes biologiques pour mieux récupérer",
        "why": {
          "p1": "Le sommeil n'est pas passif. Pendant la nuit, le cerveau trie, consolide et régule vos émotions.",
          "tip1": "Un sommeil régulier est reconnu comme facteur de protection dans les recommandations de soins en psychiatrie."
        },
        "how": {
          "intro": "Vous n'avez pas besoin de tout changer d'un coup. Choisissez une seule habitude cette semaine.",
          "list1": [
            "Se lever à la même heure chaque matin, y compris le week-end",
            "Réserver le lit au sommeil uniquement — principe du contrôle des stimuli (TCC-I)",
            "Éteindre les écrans 30 à 60 minutes avant le coucher",
            "Aérer la chambre 10 minutes avant de dormir",
            "Éviter le café et le thé après 14h — à ajuster avec votre soignant"
          ]
        }
      }
    }
  }
}
```

```json
// psyedu_teen.json (ado — seulement les phrases qui changent)
{
  "psyedu_teen": {
    "diet_weight_psycho": {
      "sleep_chrono": {
        "why": {
          "p1": "Le sommeil n'est pas passif. Pendant la nuit, ton cerveau trie, consolide et régule tes émotions."
        },
        "how": {
          "intro": "Tu n'as pas besoin de tout changer d'un coup. Choisis une seule habitude cette semaine.",
          "list1": [
            "Te lever à la même heure chaque matin, y compris le week-end",
            "Réserver le lit au sommeil uniquement",
            "Éteindre les écrans 30 à 60 minutes avant de dormir",
            "Aérer ta chambre 10 minutes avant de dormir",
            "Éviter le café et le thé après 14h — à ajuster avec ton soignant"
          ]
        }
      }
    }
  }
}
```

---

## 5. Architecture technique

### Fichiers créés

```
supabase/schema.sql                                      ← tables + RLS ajoutées
supabase/seed/psyedu_seed.sql                            ← 8 topics + blocs initiaux
apps/mobile/src/services/psyeduService.ts                ← fetch topics + blocks, cache MMKV
apps/mobile/src/components/PsyEduBlockRenderer.tsx       ← rendu des blocs par type
apps/mobile/src/components/InlineText.tsx                ← gras inline **...** + fallback teen
apps/mobile/src/i18n/locales/fr/psyedu.json              ← textes adultes
apps/mobile/src/i18n/locales/fr/psyedu_teen.json         ← surcharges ado
```

### Fichiers modifiés

```
apps/mobile/src/screens/modules/DietWeightPsychoScreen.tsx
  → FlatList → SectionList (2 sections)
  → MaterialCommunityIcons → lucide-react-native
  → données locales → appel psyeduService

apps/mobile/src/screens/modules/DietWeightPsychoDetailScreen.tsx
  → suppression import Markdown
  → import <PsyEduBlockRenderer>
  → ajout <TeenAccent teenColor="diet_weight_psycho" />

apps/mobile/src/i18n/index.ts
  → import psyedu.json + psyedu_teen.json

apps/mobile/src/theme/teen.ts
  → ajout couleur + entrée pour 'diet_weight_psycho'
```

### Fichiers supprimés

```
apps/mobile/src/constants/dietWeightPsychoContent.ts
```

### Dépendances

| Action | Package |
|---|---|
| Supprimer | `react-native-markdown-display` |
| Ajouter | `lucide-react-native` |

---

## 6. Composants

### `<InlineText>`

Résout un `text_code` i18n, applique le fallback teen si actif, et rend le gras inline `**...**` :

```
text_code + isTeenMode → texte résolu → split **...** → <Text> + <Text bold>
```

Aucune dépendance externe. Le mini-parseur tient en ~15 lignes.

### `<PsyEduBlockRenderer>`

Reçoit un tableau de blocs triés par `sort_order` et rend chacun via un switch sur `block_type` :

```
blocks: PsyEduBlock[] → map → heading | paragraph | bullet_list | tip | blockquote | source_link
```

Les blocs `source_link` utilisent `Pressable` + `Linking.openURL(href)`.

### `<TeenAccent>` dans les écrans

```tsx
// DietWeightPsychoScreen.tsx et DietWeightPsychoDetailScreen.tsx
const { teenColor } = useTeen()
<TeenAccent color={teenColor('diet_weight_psycho')} />
```

---

## 7. Écran liste — SectionList à 2 sections

```
Section 1 : "Hygiène de vie"
  → sleep_chrono  (sort_order 6)
  → nutrition_brain (sort_order 7)
  → gentle_activity (sort_order 8)

Section 2 : "Médicaments & alimentation"
  → general         (sort_order 1)
  → antipsychotics  (sort_order 2)
  → methylphenidate (sort_order 3)
  → antidepressants (sort_order 4)
  → mood_stabilizers (sort_order 5)
```

Les titres de sections sont des clés i18n dans `common.json` (ex : `modules.diet_weight_psycho.section_lifestyle` et `modules.diet_weight_psycho.section_medication`).

---

## 8. Icônes — Lucide React Native

**Installation :**

```bash
cd apps/mobile && npm install lucide-react-native
```

Icônes proposées pour les 8 fiches :

| `topic_key` | `icon_name` | Import |
|---|---|---|
| `general` | `Info` | `import { Info } from 'lucide-react-native'` |
| `antipsychotics` | `Pill` | `import { Pill } from 'lucide-react-native'` |
| `methylphenidate` | `Zap` | `import { Zap } from 'lucide-react-native'` |
| `antidepressants` | `SmilePlus` | `import { SmilePlus } from 'lucide-react-native'` |
| `mood_stabilizers` | `HeartPulse` | `import { HeartPulse } from 'lucide-react-native'` |
| `sleep_chrono` | `Moon` | `import { Moon } from 'lucide-react-native'` |
| `nutrition_brain` | `Apple` | `import { Apple } from 'lucide-react-native'` |
| `gentle_activity` | `Footprints` | `import { Footprints } from 'lucide-react-native'` |

> **Règle globale :** Lucide (`lucide-react-native` mobile, `lucide-react` web) est la bibliothèque d'icônes de référence pour tous les modules futurs.

---

## 9. Normes rédactionnelles des 3 nouvelles fiches

### Structure de chaque fiche

```
section_key = 'why'     → Volet 1 : apport théorique vulgarisé
section_key = 'how'     → Volet 2 : astuces concrètes
section_key = 'sources' → Volet 3 : références officielles
```

### Accessibilité cognitive

- Phrases ≤ 20 mots
- Paragraphes ≤ 4 phrases
- Gras inline (`**terme**`) à la première occurrence de chaque concept technique
- Blocs `tip` pour les points-clés
- Blocs `blockquote` pour les mises en garde douces
- Zéro jargon sans définition entre parenthèses
- Formulation déculpabilisante systématique

---

## 10. Contenu des 3 nouvelles fiches

### Fiche `sleep_chrono` — Le sommeil et la récupération

**Seed :**

```
module_key : diet_weight_psycho | topic_key : sleep_chrono
icon_name  : Moon | sort_order : 6
```

**Volet `why` — blocs dans l'ordre**

| sort | block_type | text_code / items_codes |
|---|---|---|
| 1 | `heading` | `psyedu.section.why` |
| 2 | `paragraph` | Le sommeil n'est pas passif. Le cerveau trie, consolide et régule vos émotions pendant la nuit. |
| 3 | `paragraph` | Pendant le **sommeil paradoxal**, les expériences de la journée sont intégrées. C'est la **consolidation émotionnelle**. |
| 4 | `paragraph` | Le sommeil favorise la **neuroplasticité** — la capacité du cerveau à former de nouvelles connexions. Une forme de "réparation" naturelle. |
| 5 | `tip` | Un sommeil régulier est reconnu comme facteur de protection dans les recommandations de soins en psychiatrie. |
| 6 | `paragraph` | Le corps suit un **rythme circadien** — une horloge interne d'environ 24 heures. Elle régule le sommeil, l'humeur, la température et l'appétit. |
| 7 | `paragraph` | Le **lever à heure fixe** est le synchroniseur le plus puissant de cette horloge. Recommandation HAS/INSV. |
| 8 | `paragraph` | Les **écrans** bloquent la **mélatonine** (hormone du sommeil) via leur lumière bleue. Leur contenu provoque aussi un **hyperéveil cognitif** qui repousse l'endormissement. |
| 9 | `paragraph` | Café, thé et nicotine bloquent l'**adénosine** — une substance naturelle qui pousse au sommeil. L'effet de la caféine dure environ 5 heures. |

**Volet `how` — blocs dans l'ordre**

| sort | block_type | Contenu |
|---|---|---|
| 1 | `heading` | `psyedu.section.how` |
| 2 | `tip` | Vous n'avez pas besoin de tout changer d'un coup. Choisissez une seule habitude cette semaine. *(teen : Tu n'as pas besoin…)* |
| 3 | `bullet_list` | 5 items : (1) Se lever à la même heure chaque matin, y compris le week-end. (2) Réserver le lit au sommeil uniquement — contrôle des stimuli (TCC-I). (3) Éteindre les écrans 30 à 60 min avant le coucher. (4) Aérer la chambre 10 min avant de dormir. (5) Éviter le café et le thé après 14h — à ajuster avec votre soignant. |

**Volet `sources`**

| sort | block_type | label / href |
|---|---|---|
| 1 | `heading` | `psyedu.section.sources` |
| 2 | `source_link` | HAS (2017) — Prise en charge des troubles du sommeil / `https://www.has-sante.fr` |
| 3 | `source_link` | INSV — Institut National du Sommeil et de la Vigilance / `https://www.insv.fr` |
| 4 | `source_link` | Harvey AG (2008) — Sleep and circadian rhythms in bipolar disorder — *Journal of Psychiatry* |
| 5 | `source_link` | Walker M (2017) — *Why We Sleep* — Penguin |

---

### Fiche `nutrition_brain` — L'alimentation et le cerveau

**Seed :**

```
module_key : diet_weight_psycho | topic_key : nutrition_brain
icon_name  : Apple | sort_order : 7
```

**Volet `why`**

| sort | block_type | Contenu |
|---|---|---|
| 1 | `heading` | `psyedu.section.why` |
| 2 | `paragraph` | Le système digestif contient environ 500 millions de neurones. C'est pourquoi on l'appelle parfois le **"deuxième cerveau"**. |
| 3 | `paragraph` | Le **microbiote** — les milliards de bactéries de notre intestin — communique avec le cerveau via le nerf vague et des molécules chimiques. |
| 4 | `paragraph` | Environ 95 % de la **sérotonine** du corps est produite dans l'intestin. La sérotonine influence l'humeur, l'anxiété et le sommeil. |
| 5 | `paragraph` | Une alimentation variée et riche en fibres favorise un microbiote diversifié. Le cerveau est sensible aux carences en fer, vitamines B et oméga-3. |
| 6 | `paragraph` | L'**hydratation** est souvent sous-estimée. Certains médicaments peuvent modifier la sensation de soif — votre soignant peut préciser vos besoins. |
| 7 | `paragraph` | L'**alcool** est un dépresseur du système nerveux central. Il peut paraître sédatif à court terme, mais perturbe le sommeil et l'humeur à moyen terme. |
| 8 | `blockquote` | Les substances (cannabis, autres) interagissent avec les récepteurs du cerveau et peuvent perturber l'équilibre des traitements. Votre soignant est le bon interlocuteur pour en parler. |

**Volet `how`**

| sort | block_type | Contenu |
|---|---|---|
| 1 | `heading` | `psyedu.section.how` |
| 2 | `paragraph` | La **règle des tiers** (PNNS) est un repère simple pour composer une assiette équilibrée. |
| 3 | `bullet_list` | 3 items : (1) 1/3 **féculents** — riz, pâtes, pain complet, pommes de terre. (2) 1/3 **légumes** — frais, surgelés ou en conserve. (3) 1/3 **protéines** — viande, poisson, œufs, légumineuses. |
| 4 | `tip` | Cette règle est un repère, pas une obligation. L'objectif est la variété, pas la perfection. |
| 5 | `paragraph` | **Hydratation :** 1,5 à 2 litres d'eau par jour est un repère général. L'eau plate, les infusions et les tisanes sans sucre comptent. |
| 6 | `bullet_list` | 3 micro-habitudes : (1) 3 repas à heures régulières plutôt que des repas sautés. (2) Commencer par les légumes et les protéines avant les féculents. (3) Un petit-déjeuner avec des protéines aide à tenir jusqu'au déjeuner. |

**Volet `sources`**

| sort | block_type | label / href |
|---|---|---|
| 1 | `heading` | `psyedu.section.sources` |
| 2 | `source_link` | OMS — Nutrition et santé mentale / `https://www.who.int/fr` |
| 3 | `source_link` | PNNS — Programme National Nutrition Santé / `https://www.mangerbouger.fr` |
| 4 | `source_link` | Dinan TG, Cryan JF (2017) — Gut instincts — *Journal of Physiology* |
| 5 | `source_link` | Cryan JF et al. (2019) — The Microbiota-Gut-Brain Axis — *Physiological Reviews* |

---

### Fiche `gentle_activity` — L'activité physique douce

**Seed :**

```
module_key : diet_weight_psycho | topic_key : gentle_activity
icon_name  : Footprints | sort_order : 8
```

**Volet `why`**

| sort | block_type | Contenu |
|---|---|---|
| 1 | `heading` | `psyedu.section.why` |
| 2 | `paragraph` | L'activité physique libère des **endorphines** — molécules naturelles qui réduisent la douleur et procurent un sentiment de bien-être. |
| 3 | `paragraph` | Elle stimule la production de **BDNF** (facteur neurotrophique cérébral — une protéine qui favorise la croissance des neurones, parfois appelée "engrais pour le cerveau"). |
| 4 | `paragraph` | Elle régule les hormones du stress (**cortisol**, adrénaline) et améliore la qualité du sommeil. |
| 5 | `paragraph` | Coupler la marche à la **lumière du jour** amplifie les bénéfices. La lumière naturelle synchronise l'horloge biologique et stimule la sérotonine. |
| 6 | `tip` | 20 minutes de marche dehors le matin = activité physique + lumière naturelle = double bénéfice. |
| 7 | `paragraph` | Le **NEAT** (Non-Exercise Activity Thermogenesis) désigne toute l'énergie dépensée hors sport formel : escaliers, ménage, se lever régulièrement. |
| 8 | `paragraph` | Le NEAT peut représenter une part importante de votre activité totale. Vous bougez peut-être plus que vous ne le pensez. |
| 9 | `blockquote` | Certains médicaments peuvent provoquer une fatigue physique. C'est un effet connu — parlez-en à votre soignant. Même un effort très doux a un effet réel. |

**Volet `how`**

| sort | block_type | Contenu |
|---|---|---|
| 1 | `heading` | `psyedu.section.how` |
| 2 | `tip` | 5 minutes de marche valent mieux que zéro. Chaque petit effort compte. |
| 3 | `paragraph` | **Objectif starter :** 10 minutes de marche par jour, de préférence le matin à la lumière du jour. |
| 4 | `bullet_list` | 4 exemples de NEAT : (1) Descendre un arrêt plus tôt. (2) Prendre les escaliers à la place de l'ascenseur. (3) Se lever 5 minutes toutes les heures si vous êtes assis longtemps. (4) Faire une courte marche après les repas. |
| 5 | `paragraph` | **Activités douces :** marche, yoga doux, tai-chi, natation, vélo en plat. L'intensité modérée — pouvoir parler sans être essoufflé — est suffisante. |
| 6 | `paragraph` | Associez l'activité à un moment fixe de la journée pour créer une habitude. Après le café du matin ou avant le déjeuner sont de bons ancrages. |

**Volet `sources`**

| sort | block_type | label / href |
|---|---|---|
| 1 | `heading` | `psyedu.section.sources` |
| 2 | `source_link` | HAS (2019) — Activité physique et santé mentale / `https://www.has-sante.fr` |
| 3 | `source_link` | OMS (2020) — Lignes directrices sur l'activité physique / `https://www.who.int/fr` |
| 4 | `source_link` | Cotman CW, Berchtold NC (2002) — Exercise and brain health — *Trends in Neurosciences* |
| 5 | `source_link` | Blumenthal JA et al. (1999) — Exercise training in major depression — *Archives of Internal Medicine* |

---

## 11. Tests à prévoir

| Type | Ce qui est testé |
|---|---|
| Service | `fetchTopicsByModule('diet_weight_psycho')` → 8 topics, 2 sections correctes |
| Service | `fetchBlocksByTopic(id)` → blocs triés, section_key correct |
| Rendu liste | 8 fiches affichées, 2 sections visuelles, icônes Lucide correctes |
| Navigation | Appui fiche → `DietWeightPsychoDetail` avec bon `topicId` |
| BlockRenderer | Chaque `block_type` rend le bon composant natif |
| InlineText | `**mot**` → rendu gras ; texte sans `**` → rendu normal |
| InlineText | Fallback teen : clé `psyedu_teen.xxx` présente → utilisée ; absente → fallback `psyedu.xxx` |
| source_link | Tap → `Linking.openURL` appelé avec le bon `href` |
| TeenAccent | Visible si `isTeenMode = true`, invisible sinon |
| Edge case | `topicId` inconnu → écran d'erreur "Fiche introuvable" |
| Edge case | Erreur réseau → état d'erreur, pas de crash |
| Migration | Les 5 fiches migrées restent accessibles avec leurs `topic_key` |

---

## 12. Documentation finale

Une fois la feature livrée, mettre à jour `docs/module-diet-weight-psycho.md` :

- Remplacer la section "Architecture" par la nouvelle (tables, service, BlockRenderer)
- Mettre à jour le tableau des IDs (8 fiches)
- Documenter la convention i18n `psyedu` / `psyedu_teen`
- Supprimer les références à `dietWeightPsychoContent.ts` et `react-native-markdown-display`

Ce fichier de spec (`spec-diet-weight-psycho-extension.md`) peut ensuite être archivé ou supprimé.
