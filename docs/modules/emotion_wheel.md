# Nommer ce que je ressens (`emotion_wheel`)

> Renommé en juillet 2026 (ex « Roue des émotions », ticket #249). L'identifiant
> technique `emotion_wheel` ne change pas : seuls le libellé et la description
> affichés bougent. Le nom praticien côté web suit dans le ticket #261.

> Refonte 2026 (branche `refonte/roue-des-emotions`). Conception et décisions
> détaillées : [`docs/spec/refonte-roue-emotions.md`](../spec/refonte-roue-emotions.md).
> Refonte UX en cours : epic #248 (mobile) et #260 (web praticien).

## L'écran de première ouverture (K-2, ticket #250)

Un **écran plein**, affiché une seule fois au premier accès, jamais revu ensuite. Ce
n'est volontairement **pas une modale** : une modale se balaie par réflexe, et ce
contenu dit au patient ce que deviennent ses notes.

- Le libellé est **« J'ai compris »**, pas « J'accepte ». C'est un **accusé de
  lecture**, pas un consentement : rien n'est journalisé, **aucun objet de consentement**
  (version, retrait, révocation) n'est créé. En fabriquer un obligerait à le gérer
  ensuite, pour une information qui n'en demande pas.
- L'état « déjà vu » est **local à l'appareil** (`module_settings`, clé
  `onboarding_seen`) et **non synchronisé** : « cet écran a été vu » est un état
  d'interface, pas une donnée de soin. Le répliquer côté serveur reviendrait à stocker
  une trace de navigation sans valeur clinique, ce que la minimisation RGPD demande
  d'éviter. C'est l'exception documentée prévue par `.claude/rules/sync-service.md`.
- Le même contenu reste consultable à tout moment dans la **fiche ⓘ**.
- Un échec de lecture de l'état **ouvre le module** plutôt que d'imposer l'écran : une
  panne technique ne doit pas bloquer l'accès.

## Modifier une entrée (K-8, ticket #256)

Une entrée ne pouvait qu'être supprimée : une erreur de saisie obligeait à tout
refaire. L'écran de première ouverture promet pourtant par écrit qu'on peut modifier.

- **⋯ puis « Modifier cette entrée »** rouvre le parcours **à l'étape 1**, ce qui permet
  de corriger l'émotion elle-même, et de **nommer enfin une entrée « Sans mot »**.
- Les **champs facultatifs sont rechargés** (intensité, contexte, contexte libre, note) :
  on ne fait pas ressaisir ce qui n'a pas changé.
- L'entrée **conserve son identifiant et son horodatage d'origine**. C'est un point
  technique à ne pas perdre : `INSERT OR REPLACE` supprime puis réinsère la ligne, donc
  sans passer `created_at` explicitement, une simple correction ferait **remonter
  l'entrée en tête d'historique** et changerait son jour. `saveTreeSelection` accepte
  donc un `created_at` optionnel, transmis jusqu'au payload de synchronisation.
- Une entrée « Sans mot » rouverte peut être **réenregistrée telle quelle** : la
  modification ne force personne à nommer.

## L'accueil et l'historique (K-3, ticket #251)

L'accueil poussait l'historique sous la ligne de flottaison, coincé entre un bandeau de
psychoéducation permanent et un pavé de disclaimer en pied. Les deux passent dans la
**fiche ⓘ** de l'en-tête : un contenu permanent qu'on ne lit plus ne protège personne,
alors qu'un contenu à un tap reste consultable quand la question se pose.

- **Historique groupé par jour** : « AUJOURD'HUI », « HIER », puis la date. Le
  groupement est une **navigation**, pas une analyse : aucun total par jour, aucune
  moyenne, aucune comparaison d'un groupe à l'autre, aucune flèche d'évolution.
- Le jour est calculé sur les **composants locaux** de la date, jamais via
  `toISOString()` : en fuseau positif, une saisie de 23 h 30 changerait de groupe.
  Testé.
- Chaque carte porte un **⋯** qui ouvre une feuille d'actions (E3a) rappelant l'entrée,
  avec « Supprimer » (confirmation) et, à partir de #256, « Modifier ».
- La **fiche ⓘ** (E3b) tient quatre sections : à quoi ça sert, qui voit quoi, en cas de
  crise, sources. Contenu 100 % en base (`info_title_N` / `info_body_N`), la section
  « sources » étant alimentée par le champ `footer_note` existant, sans duplication.

## L'entrée sans émotion nommée (K-7, ticket #255)

Réponse au **défaut n°1 de l'audit** : le module revendiquait l'alexithymie comme
indication et ouvrait sur « quelle famille d'émotion ? ». Ne pas savoir répondre à
cette question *est* le trouble, et aucune porte de sortie n'existait.

« Je ne sais pas trop » (E4) ouvre désormais la fiche **sans émotion sélectionnée** :
mêmes champs, titre « On garde le moment, sans le nommer. », et le rappel qu'on pourra
nommer plus tard en modifiant l'entrée. Décrire une situation est précisément ce que
sait faire le patient qui ne trouve pas le mot.

- L'entrée apparaît dans l'historique en **« Sans mot »**, avec un **filet gris neutre**
  et non la teinte d'une famille qu'elle n'a pas. C'est une entrée légitime, pas une
  entrée dégradée : aucun message ne présente l'absence de mot comme un échec.
- Un **chemin vide reste refusé** partout ailleurs : c'est la prop de config
  `enable_wordless` qui l'autorise, et elle seule.
- **Limite connue** : `tree_selections.selected_id` est `NOT NULL` depuis l'origine.
  L'entrée sans mot porte donc une chaîne vide (`WORDLESS_SELECTED_ID`), et c'est le
  **chemin vide** qui l'identifie sémantiquement. Rendre la colonne nullable demanderait
  de reconstruire la table SQLite : différé volontairement.
- La condition de réouverture de « la porte du corps » se mesure sur ces entrées : si
  leur part ne diminue pas dans le temps chez les mêmes patients, le module n'assure pas
  son travail d'apprentissage. Voir la note de clôture de l'epic #248.

## La fiche unique (K-6, ticket #254)

Les trois étapes facultatives (intensité, contexte, note) tiennent sur **un seul
écran scrollable**, « Enregistrer » en bas. Traversées en file indienne, elles étaient
le premier prédicteur d'abandon, et la note libre, le champ le plus riche
cliniquement, se retrouvait enterrée derrière deux écrans qu'on pouvait sauter sans
les lire.

- **Une saisie complète = 3 taps** : famille, nuance sans mots, Enregistrer.
- **Intensité 1 à 5**, sur une seule ligne. Motif décisif : 10 cibles tactiles de
  44 px ne tiennent pas sur la largeur d'un téléphone. Re-taper le cran actif le
  désélectionne, le champ restant facultatif de bout en bout.
- **« + Autre » ouvre un champ libre**, stocké dans la colonne `context_other` de
  `tree_selections`, **séparée** de `context` : celle-ci ne contient que des clés
  i18n, et y glisser un texte patient le ferait passer dans `t()`, avec le risque
  qu'il tombe sur une clé existante.
- Les saisies antérieures **ne sont pas recalculées** : un 7/10 reste un 7/10.
  Transformer une valeur que le patient a donnée serait une interprétation.

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
- Intensité = **chiffre brut** (1 à 5 depuis K-6), sans label ni couleur de seuil, et
  **sans valeur par défaut** : une valeur pré-cochée serait une réponse que le patient
  n'a pas donnée. Les ancrages « à peine » / « au maximum » bornent l'échelle, ils ne
  qualifient aucune valeur.
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
- Web : `ModulePreviewPanel` → `TreeSelectorLayout` : aperçu praticien **interactif**,
  miroir du flux mobile (familles → nuances → mots → intensité → contexte → note),
  navigable en lecture seule (« Enregistrer » ne persiste pas).
- Web, onglet **Vue patient** : `ModulePatientViewPanel` dévie vers
  `EmotionNamingPatientView` (#267), rail des **neuf écrans** du parcours patient,
  numérotés et légendés, avec puces de filtre par étape. Voir ci-dessous.
- Mobile : `ModuleContentScreen` → `TreeSelector/TreeSelectorLayout` (saisie patient).

### Vue patient : le rail des neuf écrans

| # | Écran | Étape (filtre) |
|---|---|---|
| 1 | Première ouverture | Découverte |
| 2 | Accueil et historique | Découverte |
| 3 | Étape 1, la famille | Saisie |
| 4 | Étape 2, la nuance et ses mots | Saisie |
| 5 | Étape 3, la fiche | Saisie |
| 6 | Sans émotion nommée | Sans émotion nommée |
| 7 | Menu d'une entrée | Relire et corriger |
| 8 | Fiche du module | Découverte |
| 9 | Réglage des rappels, côté patient | Réglages |

- La coquille (bandeau, filtres, rail, pied) est **partagée** avec la vue patient de
  « Décrocher d'une pensée » : `PatientScreenRail`. Un troisième module de parcours n'a
  plus qu'à fournir ses écrans.
- La **numérotation suit le parcours complet** : filtrer réduit le rail sans
  renuméroter. L'écran 9 reste l'écran 9, même seul à l'écran.
- **Rien n'est actionnable** dans le rail : ce sont des vignettes, pas un parcours
  rejouable. Un test le vérifie (aucun `button`, `input`, `a`, `select` dans le rail).
- Ce qui vient de la **base** : la liste des familles, leur teinte pastel, la borne de
  l'échelle d'intensité. Ce qui vient du **code** : la composition des écrans.
  **Contrepartie assumée** (comme pour la défusion) : une refonte du parcours mobile
  désynchronise cet aperçu, qu'il faut alors remettre à jour à la main. Le
  `FieldRenderer` générique suit la base tout seul, mais ne sait montrer qu'un écran.
  Pas de troisième voie sans moteur de parcours partagé mobile/web.

## Décisions et trade-offs
- Taxonomie Willcox (qualitative) plutôt que Plutchik (paliers d'intensité) : voir spec.
- Pas de roue radiale : flux progressif plus utilisable et accessible sur mobile, et
  100 % data-driven sur le layout générique (décision UX validée).
- Pas d'animation Reanimated (non configuré côté jest) : fluidité par teinte de famille,
  cartes emoji et retours tactiles `Pressable`.
