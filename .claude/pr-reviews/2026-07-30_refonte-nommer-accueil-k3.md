---
date: 2026-07-30
branch: refonte/nommer-accueil-k3
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
files_modified: 16
rules_enriched: 0
---

# PR Review : refonte/nommer-accueil-k3
Date : 2026-07-30 · Ticket #251 (K-3) · Base : branche de #278 (K-7)

## CI GitHub Actions

| Job | Statut |
|---|---|
| typecheck-web | ✅ |
| lint-web | ✅ (aucun fichier web touché) |
| test-web | ✅ 198 fichiers, 1253 tests |
| typecheck-mobile | ✅ |
| test-mobile | ✅ 189 suites, **1333 tests** |
| SQL (deno) | ⚠️ non exécutable localement (`deno` absent) |

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 3 |
| ✅ Conformes | 18 fichiers |

---

## 🚫 VETO MDR

Aucun, et le point sensible du ticket est traité de front. Un historique groupé par
jour est **exactement** le genre d'écran qui glisse vers l'analyse : il suffirait d'un
compteur par en-tête (« AUJOURD'HUI (3) ») ou d'une moyenne d'intensité pour que la
navigation devienne une lecture évolutive.

Trois garde-fous :
1. `groupEntriesByDay` retourne des objets à **exactement deux clés** (`title`,
   `entries`) — vérifié par un test qui échouerait si un total y était ajouté.
2. L'en-tête de groupe ne rend que `section.title`, aucune dérivation.
3. Le primitive **ne calcule aucune date** : il reçoit des groupes déjà titrés, donc il
   ne peut pas inventer une comparaison entre eux.

## 🚫 Violations bloquantes

Aucune.

---

## ⚠️ Points d'attention

### 1. « Une seule flèche retour » : critère non tenu, et non bricolé

La flèche de `TreeSelectorHeader` est le seul moyen de remonter d'une étape ; celle de
l'en-tête natif quitte le module. Tenir le critère demande d'**intercepter le retour
natif** (`navigation.addListener('beforeRemove')`) pour le réinterpréter en « étape
précédente ». Cela se joue au niveau de l'écran (`ModuleContentScreen`), pas du layout,
et concerne tous les modules à parcours multi-étapes.
→ Différé et signalé pour la troisième fois (déjà dans les reviews de #273 et #275).
Mérite son ticket. Ne pas le cocher tant qu'il n'est pas fait.

### 2. « ⋯ → Modifier » différé à #256

La feuille d'actions ne propose que « Supprimer ». L'option « Modifier cette entrée »
arrive avec le parcours pré-rempli de #256 (K-8), sans quoi elle ne mènerait nulle part.
Même politique que le bouton de sortie de #275 et la ligne de rappel de cette PR :
**on ne rend pas un contrôle avant sa destination**.

### 3. Piège de test, à retenir

Les deux nouveaux tests d'intégration échouaient sur `Unable to find testID: menu-sel-1`
alors que l'élément **était** dans l'arbre rendu (vérifié par un dump). Cause : la
requête était faite **à l'intérieur** de `act(async () => …)`, avant que le chargement
asynchrone de l'historique ne soit retombé. Correctif : attendre la carte
(`await screen.findByTestId('entry-card-…')`) **hors** de `act`, puis presser.
→ Pattern à connaître : dans ces tests, `findBy*` imbriqué dans `act` peut échouer sur
un composant pourtant monté. Attendre l'ancre stable d'abord.

---

## ✅ Points positifs

- **La dette de la corbeille nue est soldée.** La review de #273 relevait un `Pressable`
  nu avec `hitSlop={8}` recopié à la main, exactement le cas décrit dans `lessons.md`
  § mse-entry-slider. Le ⋯ qui la remplace passe par `ui/Button` en mode icône seule :
  le `hitSlop` vient du primitive, plus de recopie.
- **La date locale est traitée comme un piège connu**, pas découverte en route : le
  helper documente pourquoi il n'utilise pas `toISOString()`, et un test verrouille le
  cas des 23 h 30.
- **Config-first tenu sur un contenu éditorial** : les quatre sections de la fiche ⓘ
  sont des clés indexées `info_title_N` / `info_body_N` lues par `collectIndexed`, pas
  de la prose dans un composant. La section « sources » **réutilise** le champ
  `footer_note` au lieu de dupliquer la citation.
- **La migration retire la prop `intro`** au lieu de la laisser orpheline : sa présence
  laisserait croire qu'un écran l'affiche encore.
- **Répartition des responsabilités respectée** : le groupement (logique de date) vit
  dans les helpers du layout, testé unitairement ; le primitive reste présentationnel et
  reçoit des groupes prêts. `TreeSelectorInfoSheet` est dans `features/`, pas dans
  `ui/`, parce qu'il lit de la config de module.

---

## Checklist finale

- [x] MDR : groupement sans total ni moyenne, verrouillé par test
- [x] i18n : fr/en, aucune prose dans le code
- [x] Config-first : fiche ⓘ en base, seed et migration miroirs
- [x] Design system : `ui/Button` pour le ⋯ et l'icône ⓘ, `ui/Chip` pour les contextes
- [x] Un fichier = un composant
- [x] Ponctuation : aucun tiret long ajouté (2 corrigés en review)
- [x] TypeScript strict, zéro suppression
- [x] Documentation : `docs/modules/emotion_wheel.md` + `apps/mobile/docs/design-system.md`
- [ ] Une seule flèche retour : **non tenu**, motif ci-dessus
- [ ] ⋯ → Modifier : **différé à #256**

## 📚 Enrichissement des règles

Le piège de test du point 3 mérite une entrée dans `lessons.md` s'il se reproduit : pour
l'instant il est consigné ici et dans le message de commit. Aucune violation de règle
existante à consigner.
