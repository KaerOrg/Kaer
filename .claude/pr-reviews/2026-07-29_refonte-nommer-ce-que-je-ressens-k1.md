---
date: 2026-07-29
branch: refonte/nommer-ce-que-je-ressens-k1
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
warnings: 2
files_created: 1
files_modified: 13
rules_enriched: 0
---

# PR Review : refonte/nommer-ce-que-je-ressens-k1
Date : 2026-07-29 · Ticket #249 (K-1)

## CI GitHub Actions (commandes exactes du workflow)

| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ 0 erreur (200 warnings préexistants, aucun sur le diff) |
| test-web | `cd apps/web && npx vitest run` | ✅ 198 fichiers, 1253 tests |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 189 suites, 1289 tests |

> **Flake observé, hors périmètre.** Deux exécutions de la suite web lancées pendant
> que la suite mobile tournait en parallèle ont fait échouer
> `DashboardPage.invite-form.test.tsx` (`userEvent.click` + `waitFor` en timeout).
> Le fichier passe isolément sur la branche **et** sur `main` (29/29), et la suite
> complète passe sur les deux dès qu'elle tourne seule. La branche ne touche aucun
> fichier web : contention CPU, pas une régression. À surveiller si la CI le
> reproduit.

## Synchronisation avec main

- Merge `origin/main` : propre (`Already up to date`)
- Fichiers en conflit résolus : aucun

## Fichiers analysés

- **Créés** : 1 (`apps/mobile/src/__tests__/emotionWheelNaming.guard.test.ts`)
- **Modifiés** : 13 (8 locales mobile, 5 documents)

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 2 |
| ✅ Conformes | 14 fichiers |

---

## 🚫 VETO MDR

Aucun. La modification **améliore** la conformité (voir points positifs).

## 🚫 Violations bloquantes

Aucune.

---

## ⚠️ Points d'attention

### `apps/mobile/src/i18n/locales/fr/common.json`

**[Dette préexistante, hors périmètre] Namespace `module.*` fantôme.**
Le fichier porte deux blocs `emotion_wheel` : `modules.emotion_wheel` (lu par la liste
des modules et l'en-tête d'écran) et `module.emotion_wheel` (namespace legacy de 21
modules, lu uniquement par `ModuleContentScreen.tsx:164`). Or `tree_selector` figure
dans `SELF_MANAGED_LAYOUTS` : l'écran retourne en amont (ligne 149) et cette
description **n'est jamais rendue** pour ce module. Le pendant anglais n'existe pas
(le namespace `module` d'`en/common.json` ne contient que `cognitive_saturation`).
→ Les deux blocs ont été alignés sur le nouveau nom pour ne pas laisser l'ancien
traîner, mais le namespace `module.*` mérite un audit dédié : soit il est mort et se
supprime, soit il est vivant pour d'autres modules et sa parité `en` est à faire.
Hors périmètre de ce ticket.

### Critère d'acceptation à nuancer

Le ticket annonce « le CI vérifie déjà le compte de clés » pour la parité i18n.
**C'est inexact** : `.github/workflows/ci.yml` ne comporte aucun job de parité i18n, et
`apps/mobile/src/__tests__/` n'en contient pas non plus. La parité a donc été vérifiée
manuellement, et le garde-fou ajouté par cette PR ne couvre que le renommage, pas la
parité générale des locales.
→ Un garde-fou de parité fr/en/teen serait utile à l'échelle du dépôt. Ticket distinct.

---

## ✅ Points positifs

- **Gain MDR.** L'ancienne description patient, « Explorer et nommer ses émotions avec
  précision pour lutter contre l'alexithymie. », affichait une **indication clinique**
  au patient dans la liste des modules. La nouvelle, « Mettre un mot précis sur ce que
  vous ressentez. », décrit l'usage sans poser d'indication ni de finalité
  thérapeutique. C'est un progrès net sur la règle d'or, au-delà du seul confort de
  lecture.
- **Occurrence rattrapée hors énoncé du ticket** : le pied de page du module
  (`modules.emotion_wheel.footer`) commençait par « Roue des émotions » en `fr/common`,
  `en/common`, `fr/teen` et `en/teen`. Le ticket ne la listait pas ; sans elle, le
  critère « plus aucune occurrence dans l'UI patient » aurait été faux.
- **Un module, un seul nom.** La surcharge teen du titre (« Ce que je ressens vraiment »
  / « What I'm really feeling ») a été **retirée** au lieu d'être recopiée : le nom
  retombe sur `common` par le fallback i18next. Un module ne peut plus porter deux noms
  selon le mode.
- **Pas de duplication inutile** : aucune surcharge teen de `label` (le nom est déjà à
  la première personne, une variante serait la même chaîne). Seule la `description`,
  qui vouvoie en common, reçoit une variante tutoyée.
- **Garde-fou anti-régression** ajouté, sur le patron de `noHorizontalScroll.guard.test.ts` :
  l'ancien nom se réintroduit facilement par un merge sur un fichier de 2000+ lignes.
- **Registre teen conforme** : « Mettre un mot précis sur ce que tu ressens. » est du
  tutoiement professionnel, sans familiarité ni élision (cf. lessons.md § Mode ado).

---

## Checklist finale

- [x] MDR 2017/745 : aucun seuil, alerte ou interprétation. Indication clinique **retirée** de la description patient.
- [x] i18n : zéro texte en dur, parité fr/en common **et** teen, secondaires (de/es/it/pt) alignées
- [x] Ponctuation : aucun tiret long dans les lignes ajoutées (deux occurrences corrigées en cours de review)
- [x] TypeScript strict : zéro `any`, zéro `as unknown`, zéro suppression. Type restreint aux clés réellement lues.
- [x] Tests : garde-fou couvrant les deux critères d'acceptation (5 cas)
- [x] Documentation : `docs/modules.md`, `docs/README.md`, `README.md`, `docs/modules/emotion_wheel.md`, `apps/mobile/docs/invitation-flow.md`
- [x] Zéro Supabase/SQLite dans un composant : aucun composant touché
- [x] Design system : aucune UI ajoutée
- [x] Config-first : aucun contenu de module déplacé vers du TypeScript
- [x] Schéma / RLS : aucun changement SQL
- [ ] Parité web ≡ mobile : **volontairement différée** au ticket #261 (W-1). Le nom praticien vient du catalogue web et ne suit pas les locales mobile. À l'issue de cette PR, le web affiche encore « Roue des émotions » : c'est le découpage acté par les epics #248 / #260.

## 📚 Enrichissement des règles

`lessons.md` déjà à jour : aucune violation bloquante à consigner. Les deux points
d'attention relèvent de dette préexistante et d'un constat sur l'outillage CI, pas
d'un pattern fautif introduit par cette branche.
