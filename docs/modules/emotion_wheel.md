# Roue des émotions (`emotion_wheel`)

> Refonte 2026 (branche `refonte/roue-des-emotions`). Conception et décisions
> détaillées : [`docs/spec/refonte-roue-emotions.md`](../spec/refonte-roue-emotions.md).

## Base clinique

**Technique** : labellisation émotionnelle (affect labeling) et entraînement à la
granularité émotionnelle.

**Cadrage honnête de la preuve** :
- Le **mécanisme** est solidement étayé : nommer une émotion réduit la réactivité
  amygdalienne (affect labeling, Lieberman et al., 2007) ; la **précision** du label
  est l'ingrédient actif ; la **granularité** (Barrett) est associée à une meilleure
  régulation et s'entraîne par la répétition.
- L'**instrument** (la roue) est un **outil de psychoéducation**, inspiré de la
  Feeling Wheel (Willcox, 1982). Ce n'est **pas** un instrument psychométrique validé.
  Le choix des mots relève du jugement clinique.

**Indications** : alexithymie, préparation aux entretiens, psychoéducation émotionnelle
(TCC, ACT, TCD). Public adulte et adolescent (mode teen).

## Conformité MDR 2017/745

- Couleurs et emojis = **identité de famille**, jamais une gravité clinique.
- Intensité = **chiffre brut** (1 à 10), sans label ni couleur de seuil.
- Historique = liste chronologique neutre, **aucune** tendance ni comparaison.
- Tag de contexte = donnée brute restituée telle quelle.
- **Aucune** stratégie de régulation suggérée selon l'émotion saisie.

## Taxonomie (Willcox v2)

8 familles, 37 nuances **qualitatives** (jamais des paliers d'intensité), 74 mots
précis. **Profondeur libre** : le patient valide à n'importe quel niveau.

| Famille (`node` key) | Couleur | Emoji | Nuances |
|---|---|---|---|
| Joie (`joy`) | `#F59E0B` | 😊 | Plaisir, Enthousiasme, Amour, Émerveillement, Gratitude |
| Tristesse (`sadness`) | `#3B82F6` | 😢 | Abattement, Solitude, Chagrin, Vide, Nostalgie |
| Colère (`anger`) | `#EF4444` | 😠 | Irritation, Frustration, Hostilité, Indignation, Susceptibilité |
| Peur (`fear`) | `#8B5CF6` | 😨 | Anxiété, Insécurité, Effroi, Méfiance, Impuissance |
| Dégoût (`disgust`) | `#6B8E23` | 🤢 | Répulsion, Mépris, Désapprobation |
| Honte et culpabilité (`self_conscious`) | `#B0728A` | 😳 | Honte, Culpabilité, Gêne, Dévalorisation |
| Force (`powerful`) | `#F97316` | 💪 | Confiance, Fierté, Courage, Espoir, Valorisation |
| Apaisement (`peaceful`) | `#14B8A6` | 🧘 | Calme, Sérénité, Sécurité, Compréhension, Acceptation |

> Principe clé : l'arbre encode le **QUOI** (qualité), le curseur encode le **COMBIEN**
> (intensité). « Panique » n'existe pas dans l'arbre : c'est « Effroi » à intensité
> 9-10.

## Architecture technique

### `preview_kind`
`tree_selector` — layout générique réutilisé (aucun écran dédié). Source de vérité du
contenu : `module_content_fields` + `field_props` (seed inline dans `supabase/seed.sql`,
section « MODULE : emotion_wheel »).

### Flux de saisie (mobile)
`historique → sélection (1 à 3 niveaux) → intensité (1-10, optionnel) → contexte
(chips, optionnel) → note (optionnel) → enregistrement`.

Profondeur libre via le bouton « Valider à ce niveau » (config `enable_early_validate`).

### Config (`tree_selector_config`, props sur `ew.cfg`)
`enable_intensity`, `enable_notes`, `enable_context`, `enable_early_validate`,
`intensity_min`/`intensity_max`, libellés (`intro`, `step_1_title`/`step_1_hint`,
`step_2_hint`, `step_3_hint`, `intensity_title`/`intensity_hint`, `context_title`/
`context_hint`, `notes_title`/`notes_hint`/`notes_placeholder`, `new_btn`,
`continue_btn`, `validate_here_btn`, `save_btn`, `history_label`, `empty_title`/
`empty_text`), options de contexte indexées (`context_opt_N` = clé i18n,
`context_icon_N` = nom MaterialCommunityIcons, lues via `collectIndexed`).

### Nœuds (`tree_node`)
Hiérarchie via `parent_field_id`. Props : `color` (hex famille), `emoji` (identité
visuelle, rendu web ≡ mobile), `icon` (fallback MaterialCommunityIcons).

### Stockage patient
SQLite `tree_selections` (table générique du layout). Colonnes : `selected_id`,
`selected_label`, `path_json`, `intensity`, `notes`, **`context_json`** (array de clés
i18n de contexte), `created_at`. Sync via `treeSelectionService` →
`syncUpsert`/`syncDelete` (`entry_kind = 'tree_selection'`) → `patient_entries`
(payload incluant `context`).

Migration intégrée : `emotion_entries` (ancienne table Plutchik) → `tree_selections`,
puis `ALTER TABLE tree_selections ADD COLUMN context_json`.

## Tests
- `apps/mobile/src/components/features/ModuleRenderer/FieldRenderer.tree_selector.test.tsx`
  (18 tests : navigation, intensité, contexte, profondeur libre, historique, suppression).
- `apps/mobile/src/services/treeSelectionService.test.ts` (sync + contexte).
- `apps/web/src/components/features/ModuleRenderer/layouts/TreeSelectorLayout/TreeSelectorLayout.test.tsx`
  (aperçu praticien : familles, étapes, état vide, footer).

## i18n
- Clés `modules.emotion_wheel.*` (config + `node.*` + `context.*`) dans
  `fr/common.json` et `en/common.json` (web + mobile).
- Variantes `teen.json` (fr + en, mobile) en tutoiement.
- `de/es/it/pt` : non couverts (fallback `en`).

## Sources (bouton « i » praticien)
7 entrées dans `module_sources` (seed : `supabase/seed/sources_seed.sql`) : Lieberman
2007 (IRMf affect labeling), Kircanski 2012 (ECR exposition), Willcox 1982 (instrument
source), revue granularité 2025, ECR alexithymie 2019, revue émotions auto-conscientes
(honte/culpabilité), Geneva Emotion Wheel (alternative validée).

## Écrans impactés
- Web : `ModulePreviewPanel` → `TreeSelectorLayout` — aperçu praticien **interactif**,
  miroir du flux mobile (familles → nuances → mots → intensité → contexte → note),
  navigable en lecture seule (« Enregistrer » ne persiste pas).
- Mobile : `ModuleContentScreen` → `TreeSelector/TreeSelectorLayout` (saisie patient).

## Décisions et trade-offs
- Taxonomie Willcox (qualitative) plutôt que Plutchik (paliers d'intensité) : voir spec.
- Pas de roue radiale : flux progressif plus utilisable et accessible sur mobile, et
  100 % data-driven sur le layout générique (décision UX validée).
- Pas d'animation Reanimated (non configuré côté jest) : fluidité par teinte de famille,
  cartes emoji et retours tactiles `Pressable`.
