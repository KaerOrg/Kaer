# Règle — Config d'abord, TypeScript en dernier recours

## Le principe

Toute donnée qui décrit le comportement ou la présentation d'un module **appartient en base de données**, pas dans un tableau TypeScript statique.

Exemples de données qui vont en base :
- Métadonnées d'une échelle clinique (catégorie nosologique, population cible, type d'évaluation, référence bibliographique)
- Contenu éditorial d'un module (questions, options, instructions, fiches psyedu)
- Configuration de rendu (preview_kind, layout, widgets)

Exemples de données qui restent dans le code :
- Types TypeScript (interfaces, unions) — ils compilent, ils n'ont pas leur place en base
- Constantes de présentation partagées par tous les modules (couleurs des chips d'âge, tokens CSS)
- Logique de scoring côté mobile (algorithme, pas données)

## L'erreur classique

Créer un tableau TypeScript `CLINICAL_SCALES` parce que c'est "plus rapide" :

```ts
// ❌ Tentant mais faux
export const CLINICAL_SCALES = [
  { id: 'phq9', name: 'PHQ-9', category: 'Humeur', targetAges: ['adulte', 'senior'], ... },
  { id: 'gad7', ... },
] as const
```

Ce tableau semble anodin. Mais il crée plusieurs problèmes :
- Ajouter une échelle = modifier du code TypeScript + redéployer l'app web
- Les données vivent en deux endroits (BDD pour le mobile, TS pour le web)
- Le praticien ne peut pas voir ses propres données sans redéploiement
- La parité web ≡ mobile est rompue par construction

## La bonne approche

Stocker dans `module_content_fields` avec `field_type = 'scale_meta'`, les attributs dans `field_props` :

```sql
insert into module_content_fields (id, module_id, field_type, text_code, sort_order)
values ('phq9.scale_meta', 'phq9', 'scale_meta', 'scales.descriptions.phq9', 10);

insert into field_props (field_id, prop_key, prop_value)
values
  ('phq9.scale_meta', 'evaluation_type', 'auto'),
  ('phq9.scale_meta', 'category', 'Humeur'),
  ('phq9.scale_meta', 'target_ages', '["adulte","senior"]');
```

Puis un service qui lit la BDD :

```ts
export async function fetchScaleMeta(): Promise<ScaleMetaRow[]> { ... }
```

Ajouter une nouvelle échelle = **INSERT en base uniquement, zéro redéploiement**.

## Ce que ça coûte

- Écrire le seed SQL : ~10 lignes par échelle
- Écrire le service : une fois pour toutes
- Mettre à jour les composants : supprimer le tableau statique, charger au mount

C'est un effort constant, pas croissant. La dette du tableau statique, elle, est croissante : chaque nouvelle échelle amplifie le problème.

## Leçon générale

> Quand une donnée change à la vitesse du métier (nouvelles échelles, nouvelles fiches, nouveau contenu), elle va en base.  
> Quand une donnée change à la vitesse du code (nouvelle fonctionnalité, nouveau composant), elle peut rester dans le code.

Si tu hésites : pose-toi la question — "est-ce que le praticien ou l'équipe pourrait vouloir modifier ça sans que je touche au code ?" Si oui, c'est en base.

## Nommer un layout par son motif, pas par un module

Un `preview_kind` (et le composant `layout` correspondant) décrit **une forme
d'écran réutilisable**, pas un module. Il doit donc être nommé d'après son **motif
visuel** — comme `column_form`, `tree_selector`, `decision_grid`, `sleep_journal`,
`slider_dashboard` — et **jamais** d'après un module précis (`mood_tracker`, `phq9`…).

Pourquoi : un `preview_kind` nommé d'après un module bride la réutilisation. Le jour
où un autre module veut le même écran (ex. multi-sliders + sparklines), il devrait
poser `preview_kind='mood_tracker'`, ce qui sonne faux et brouille l'intention. Un
nom de motif (`slider_dashboard`) se réutilise sans gêne.

Corollaire — **un layout générique ne hardcode pas les clés i18n d'un module.**
Les libellés propres au module (onglets, titres de section, etc.) se résolvent en
dérivant la clé depuis le `module_id` porté par les fields :

```ts
// ❌ Hardcode un module dans un layout censé être générique
t('modules.mood_tracker.tab_today')

// ✅ Dérive du module courant — le layout reste réutilisable
const moduleId = fields[0]?.module_id
t(`modules.${moduleId}.tab_today`)
```

> Test décisif : « si un deuxième module voulait ce layout, faudrait-il toucher au
> code du layout ? » Si oui (nom de module en dur, clés i18n figées), c'est un défaut
> de généricité — à corriger avant merge.

## Design system d'abord — étendre, ne pas redupliquer

Avant d'écrire de l'UI (composant, classe CSS, bloc de markup), vérifier le design
system. S'il existe un composant qui couvre le besoin → l'importer. S'il couvre le
besoin **mais pas exactement** → **l'étendre** (prop, variante, slot), jamais en
créer un parallèle. Ne créer un nouveau primitive que si **rien** ne correspond —
et alors avec doc design-system + test. Détail et arbre de décision :
[`coding-standards.md`](coding-standards.md) § *Checklist obligatoire* et le skill
[`pr-review`](../skills/pr-review/SKILL.md) Étape 4.

## Application dans PsyTool

Ce principe est déjà suivi pour :
- `module_content_fields` — questions, options, instructions, fiches psyedu
- `psyedu_topics` + `psyedu_blocks` — contenu des fiches psychoéducatives
- `scale_meta` fields — métadonnées des échelles cliniques (migré depuis `CLINICAL_SCALES` dans cette session)

Références : [`docs/module-engine.md`](../../docs/module-engine.md) — section *Schéma ClinicalScale*.
