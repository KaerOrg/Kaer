# Nommer ce que je ressens (`emotion_wheel`)

> Renommé en juillet 2026 (ex « Roue des émotions », ticket #249). L'identifiant
> technique `emotion_wheel` ne change pas : seuls le libellé et la description
> affichés bougent. Le nom praticien côté web suit dans le ticket #261.

> Refonte 2026 (branche `refonte/roue-des-emotions`). Conception et décisions
> détaillées : [`docs/spec/refonte-roue-emotions.md`](../spec/refonte-roue-emotions.md).
> Refonte UX en cours : epic #248 (mobile) et #260 (web praticien).

## Rédaction et accessibilité (passe K-10, ticket #258)

L'écriture du module suit trois principes, tenus par les locales et par
`ui/TreeSelector` :

- **On ne dit jamais au patient qu'il pourrait mal répondre.** Le mot « facultatif »
  a disparu des intitulés, et la phrase « c'est juste une valeur, il n'y a pas de
  bonne ou mauvaise note » a été supprimée : elle répondait à une accusation que
  personne n'avait portée.
- **Aucun jargon d'interface.** « Valider à ce niveau : Effroi » est devenu
  « Je ne sais pas », avec le niveau conservé en ligne secondaire
  (« on garde « Peur » »). Les intitulés disent ce qu'ils demandent :
  « En lien avec », « Qu'est-ce qui s'est passé ? ».
- **Les mots précis sont des étiquettes, pas des phrases sur la personne.** Ils
  s'écrivent en minuscule et sans marque d'accord (« ravi », « tendu »), là où le
  seed portait « Ravi(e) », « Inquiet/ète ». Aucun champ de genre n'existe côté
  patient : la formulation neutre est la seule voie, et elle évite d'imposer un
  accord à qui ne s'y reconnaît pas.

Charte de couleur et cibles tactiles : voir
[`apps/mobile/docs/design-system.md`](../../apps/mobile/docs/design-system.md)
§ `TreeSelector`. En résumé : le turquoise `colors.primary` porte les actions avec
un libellé sombre, la couleur de famille ne porte jamais de texte, rien sous 11 px,
aucune cible sous 44 px.

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

- Couleurs = **identité de famille**, jamais une gravité clinique. Depuis K-10 elles
  ne portent aucun texte : filet d'accent, fond très pâle, icône.
- Intensité = **chiffre brut** (1 à 10), sans label ni couleur de seuil.
- Historique = liste chronologique neutre, **aucune** tendance ni comparaison.
- Tag de contexte = donnée brute restituée telle quelle.
- **Aucune** stratégie de régulation suggérée selon l'émotion saisie.

## Taxonomie (Willcox v2)

8 familles, 37 nuances **qualitatives** (jamais des paliers d'intensité), 42 mots
précis affichés en chips. **Profondeur libre** : le patient valide à n'importe quel
niveau.

**Élagage du niveau 3** (K-5, ticket #253). Une paire de mots ne se justifie que si
elle sépare **deux dimensions** (tête / corps, moi / l'autre, état / mouvement),
jamais deux degrés : « écœuré » et « révulsé » ne diffèrent que par l'intensité, et
c'est le curseur qui la porte. Règle QUOI / COMBIEN appliquée jusqu'au mot.

- **21 nuances** portent deux mots au choix, affichés en chips dans leur carte dépliée.
- **16 nuances** n'en portent aucun : leur mot conservé vit dans leur définition
  (« Serein, rien ne pèse. ») et le patient valide directement sur la nuance.
- **L'écran du niveau 3 n'existe plus** : les mots sont des chips dans la carte de la
  nuance. Un tap de plus pour qui veut le mot exact, zéro écran de plus.
- Les **clés i18n des mots retirés restent** dans les locales : une entrée déjà saisie
  qui pointe vers l'un d'eux garde son libellé, résolu depuis le `text_code` de son
  chemin persisté. Rien n'est perdu, l'entrée est seulement rétrogradée dans l'arbre.

| Famille (`node` key) | Teinte | Définition affichée | Nuances |
|---|---|---|---|
| Joie (`joy`) | `#EFC98A` | plaisir, élan, gratitude | Plaisir, Enthousiasme, Amour, Émerveillement, Gratitude |
| Tristesse (`sadness`) | `#9CBEEA` | perte, vide, chagrin | Abattement, Solitude, Chagrin, Vide, Nostalgie |
| Colère (`anger`) | `#E5A3A3` | obstacle, injustice | Irritation, Frustration, Hostilité, Indignation, Susceptibilité |
| Peur (`fear`) | `#AC9BDE` | menace, incertitude | Anxiété, Insécurité, Effroi, Méfiance, Impuissance |
| Dégoût (`disgust`) | `#AFBE8B` | rejet, mépris | Répulsion, Mépris, Désapprobation |
| Honte et culpabilité (`self_conscious`) | `#CDA6B6` | soi en cause | Honte, Culpabilité, Gêne, Dévalorisation |
| Force (`powerful`) | `#F0B48D` | capable d'agir | Confiance, Fierté, Courage, Espoir, Valorisation |
| Apaisement (`peaceful`) | `#8ACFC6` | en sécurité, au repos | Calme, Sérénité, Sécurité, Compréhension, Acceptation |

**Teintes pastellisées et emojis supprimés** (K-4, ticket #252). Les valeurs saturées
d'origine échouaient WCAG AA sur fond clair (Joie `#F59E0B` ≈ 2:1, Force `#F97316`
≈ 3:1). Les emojis ont été retirés du seed **et** du primitive, sans être remplacés
par des pictogrammes de visage : un visage a déjà décidé ce qu'est l'émotion, à un
patient à qui l'on demande précisément de trouver la sienne, et son rendu varie selon
l'OS. La **définition** remplace l'illustration : elle aide à choisir sans interpréter.

L'historique relit la teinte dans la taxonomie **courante** : une entrée saisie avant
la pastellisation s'affiche avec la nouvelle teinte, sans que sa donnée soit réécrite.

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
