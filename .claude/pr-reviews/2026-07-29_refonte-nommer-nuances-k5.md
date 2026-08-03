---
date: 2026-07-29
branch: refonte/nommer-nuances-k5
pr_number: null
pr_url: null
ci_pass: true
merge_clean: true
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 0
  tests: 0
  docs: 0
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
warnings: 3
files_created: 2
files_modified: 11
rules_enriched: 0
---

# PR Review : refonte/nommer-nuances-k5
Date : 2026-07-29 · Ticket #253 (K-5) · Base : branche de #275 (K-4)

## CI GitHub Actions

| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (aucun fichier web touché) |
| test-web | `cd apps/web && npx vitest run` | ✅ 198 fichiers, 1253 tests |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 189 suites, **1311 tests** |
| SQL (deno) | `deno test supabase/tests/` | ⚠️ non exécutable localement (`deno` absent) |

Les garde-fous du seed (`fieldPropsAtomic.guard`, `noRawFetch.guard`) passent : les
nouvelles `prop_value` sont des clés i18n atomiques.

## Synchronisation

Basée sur `refonte/nommer-familles-k4` (#275). **Ordre : #272 → #273 → #275 → celle-ci.**

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 3 |
| ✅ Conformes | 13 fichiers |

---

## 🚫 VETO MDR

Aucun. Les 37 définitions ont été relues une à une : elles **décrivent** un territoire
(« La menace vient de quelqu'un. », « Plus rien ne fait envie, ou plus d'énergie. »)
sans jamais qualifier une gravité, suggérer une conduite, ni comparer à une norme.
L'élagage renforce même la doctrine : les paires qui n'étaient qu'une différence de
degré (« écœuré » / « révulsé ») disparaissent, parce que le degré appartient au
curseur, pas au vocabulaire. C'est la règle QUOI / COMBIEN appliquée jusqu'au mot.

## 🚫 Violations bloquantes

Aucune.

---

## 🐛 Bug attrapé par les tests, corrigé dans la branche

**Le chemin persisté sautait la nuance.** Une carte dépliée n'est pas « traversée » :
elle n'entre pas dans `path`. En choisissant un mot dans les chips, l'entrée était
enregistrée avec `[famille, mot]` au lieu de `[famille, nuance, mot]`.

```
Reçu :   path: [{id: 'ew.joy'}, {id: 'ew.joy.serenity.calm'}]
Attendu : path: [{id: 'ew.joy'}, {id: 'ew.joy.serenity'}, {id: 'ew.joy.serenity.calm'}]
```

Le test d'intégration existant (`FieldRenderer.tree_selector.test.tsx`) l'a levé
immédiatement. Corrigé par un `handleSelectLeaf` dédié qui insère le nœud déplié, plus
un test de régression au niveau du primitive. C'est exactement le genre de perte
silencieuse de donnée clinique qu'une relecture visuelle n'aurait pas vue : l'écran
aurait paru correct.

---

## ⚠️ Points d'attention

### 1. Les clés i18n des 32 mots retirés restent dans les locales, volontairement

Le critère « les entrées existantes qui pointent vers un mot supprimé restent
lisibles » est tenu **par là** : `resolvePathLabel` lit le `text_code` du chemin
persisté, pas la taxonomie. Supprimer les clés aurait affiché la clé brute
(« modules.emotion_wheel.node.joy__plaisir__ravi ») dans l'historique d'un patient.
→ Ces 32 clés sont donc du contenu **mort dans l'arbre mais vivant à la relecture**.
À ne pas « nettoyer » lors d'une passe i18n ultérieure sans vérifier la base.

### 2. La profondeur au-delà de 3 niveaux n'est plus navigable

Le primitive annonçait une « profondeur libre ». Depuis cette PR, les feuilles d'un
nœud de niveau ≥ 2 sont des chips : un arbre à 4 niveaux verrait son niveau 4 rendu en
chips **sous** le niveau 3, sans écran dédié. Aucun module n'est concerné
(`tree_selector` n'est utilisé que par `emotion_wheel`, qui a exactement 3 niveaux), et
la contrainte est documentée dans le design system.
→ Signalé pour qu'un futur module à 4 niveaux ne découvre pas la limite en route.

### 3. Parité web ≡ mobile : l'aperçu praticien garde l'écran de niveau 3

Le layout web a sa propre navigation : il continuera d'ouvrir un écran pour les mots.
Il **hérite** en revanche de l'élagage (mêmes nœuds en base) et des définitions s'il
lit un jour la prop `def`. Résorption prévue par #267 (W-7). Le web n'a pas été touché.

---

## ✅ Points positifs

- **Config-first intégral** : 37 définitions et l'élagage vivent en base. Ajouter une
  nuance, corriger une définition ou réintroduire un mot reste un INSERT, jamais un
  déploiement. Aucune donnée de contenu n'a migré vers du TypeScript.
- **La migration ne détruit rien d'irréversible** : elle supprime des nœuds de
  taxonomie (`module_content_fields`), jamais une ligne patient. Le commentaire en tête
  explique pourquoi les clés i18n survivent, pour que personne ne « finisse le
  ménage » plus tard.
- **Le composant extrait respecte un fichier = un composant** :
  `TreeSelectorOptionCard` sort dans son propre fichier plutôt que de gonfler
  `TreeSelectorNavigation`, qui reste un routeur de niveau.
- **Réutilisation du design system** : les mots sont rendus par `ui/Chip` (taille `sm`),
  pas par un `Pressable` maison. La chip non sélectionnée porte `colors.textMuted`
  (4.8:1 sur blanc), donc AA sans avoir à toucher au primitive.
- **8 tests ajoutés** couvrant le comportement neuf : définition affichée, nuance sans
  mots en un tap, dépliage sur place, repli au re-tap, « Continuer » conditionnel,
  retour qui referme avant de remonter, et la régression du chemin.

---

## Checklist finale

- [x] Définitions en base (`field_props`), zéro texte en dur
- [x] Seed et migration idempotents et miroirs
- [x] Entrées existantes pointant vers un mot supprimé toujours lisibles
- [x] i18n fr/en à jour ; pas de variante teen nécessaire (les définitions n'emploient
      ni vouvoiement ni tutoiement : « je », « on », tournures impersonnelles)
- [x] MDR : aucune définition n'interprète, ne hiérarchise ni ne conseille
- [x] Ponctuation : aucun tiret long ajouté (1 corrigé en review)
- [x] Un fichier = un composant
- [x] Documentation : `docs/modules/emotion_wheel.md` + `apps/mobile/docs/design-system.md`

## 📚 Enrichissement des règles

`lessons.md` déjà à jour. Le bug du chemin n'est pas une violation de règle mais une
erreur de conception attrapée par la couverture existante : il est consigné dans la PR
et dans ce rapport, avec son test de régression.
