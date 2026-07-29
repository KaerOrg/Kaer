---
date: 2026-07-29
branch: refonte/nommer-familles-k4
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
files_created: 1
files_modified: 17
rules_enriched: 0
---

# PR Review : refonte/nommer-familles-k4
Date : 2026-07-29 · Ticket #252 (K-4) · Base : branche de #273 (K-10)

## CI GitHub Actions

| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (aucun fichier web touché) |
| test-web | `cd apps/web && npx vitest run` | ✅ 198 fichiers, 1253 tests |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 189 suites, **1303 tests (+10)** |
| SQL (deno) | `deno test supabase/tests/` | ⚠️ non exécutable localement (`deno` absent). Les suites ne touchent ni `field_props` ni ce seed. |

## Synchronisation

Branche basée sur `refonte/nommer-redaction-a11y-k10` (PR #273), elle-même basée sur
#272. **Ordre de fusion : #272, puis #273, puis celle-ci.**

## Fichiers analysés

- **Créés** : 1 (`supabase/migration_emotion_wheel_familles_k4.sql`)
- **Modifiés** : 17 (4 locales, 9 sources mobile, 1 seed, 2 docs, 1 test)

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 3 |
| ✅ Conformes | 18 fichiers |

---

## 🚫 VETO MDR

Aucun. Deux gains :

- Les teintes de famille passent en pastel et **ne portent plus de texte** : elles
  identifient une famille, elles ne peuvent plus être lues comme une intensité ou une
  gravité.
- Les **emojis disparaissent**. C'est un point MDR sous-estimé : un emoji de visage est
  une **interprétation affichée au patient**, alors que le module lui demande justement
  de produire la sienne. La définition textuelle qui les remplace décrit un territoire
  (« menace, incertitude ») sans qualifier ce que le patient ressent.

## 🚫 Violations bloquantes

Aucune.

---

## ⚠️ Points d'attention

### 1. Le bouton « Je ne sais pas trop » n'est pas encore visible dans l'app

Le primitive le rend **uniquement si `onSkip` est fourni**, et le layout ne le fournit
pas encore : le parcours qu'il ouvre (E4a, entrée sans émotion nommée) est le ticket
#255 (K-7). Un bouton visible menant nulle part aurait été pire qu'un bouton absent.
Les critères d'acceptation de #252 ne portent pas ce comportement, ils portent la
grille, les emojis, le contraste et la validation au niveau famille.
→ #255 n'aura qu'à brancher le callback : le rendu, les styles, les libellés et les
tests sont déjà là.

### 2. Parité web ≡ mobile : l'aperçu praticien n'a ni définitions ni pastels complets

Le layout web lit le même seed, donc il **hérite automatiquement** des teintes
pastellisées et de la disparition des emojis. En revanche il ignore la prop `def` :
l'aperçu n'affichera pas les lignes de définition tant que #267 (W-7,
`EmotionNamingPatientView`) n'est pas livré.
→ Conformément au cadrage de l'epic, le web n'a pas été touché. À noter que la parité
s'améliore malgré tout de deux tiers sans une ligne de code web, parce que la
taxonomie est en base.

### 3. Le fond `colors.neutral` du badge d'intensité vient de K-10, pas d'ici

Signalé pour la relecture : `intensityBadge` avait déjà perdu sa teinte de famille dans
#273. Cette PR n'y touche pas ; le diff peut le laisser croire à cause du contexte.

### 4. « Les 8 familles tiennent sans scroll » : vérifié par calcul, pas sur appareil

4 rangées × 62 px + gouttières = 272 px pour la grille, plus le bouton de sortie (44),
le rappel (34), la note de sources (~60) et les marges : environ 470 px sous le titre.
Cela tient largement sur un gabarit de référence, mais **le critère mérite un coup
d'œil réel** sur un petit écran avec une police système agrandie.

---

## ✅ Points positifs

- **Config-first tenu jusqu'au bout** : la définition de chaque famille est une prop
  `def` pointant une clé i18n, pas une chaîne dans le composant. Ajouter une famille
  ou changer une définition reste un INSERT.
- **La suppression des emojis est faite en base ET dans le code**, sans laisser de
  branche morte : `emoji` disparaît du primitive, du layout, des types et du chemin
  persisté. La migration contient un `DELETE` explicite, parce qu'un seed en
  `ON CONFLICT DO UPDATE` n'efface pas une ligne retirée du fichier. C'est exactement
  le piège que la règle « seeds de config » décrit.
- **L'historique relit la taxonomie courante** au lieu de faire confiance au chemin
  persisté : les entrées saisies avant la pastellisation s'affichent avec la nouvelle
  teinte, **sans réécrire la donnée du patient**. Le repli sur la valeur stockée est
  testé (famille disparue du seed).
- **Le primitive reste générique** : `definition` et `onSkip` sont optionnels, aucun
  `if (moduleId === …)`, aucune clé i18n de domaine. Un autre module pourrait monter
  cet arbre sans définition ni porte de sortie.
- **10 tests ajoutés**, dont les cas limites du helper (prop `def` absente, famille
  disparue du seed) et le fait que le bouton de sortie **n'apparaît pas** sans callback.

---

## Checklist finale

- [x] Les 8 familles et leurs définitions viennent du seed (dénominateurs non figés)
- [x] Zéro emoji : seed (DELETE), primitive, layout, types
- [x] Tout texte du module au moins AA et au moins `fontSize.xxs`
- [x] Valider au niveau famille produit une entrée complète (test existant, inchangé)
- [x] Teintes en config, pas en dur dans un composant
- [x] i18n : parité fr/en common et teen (variante teen là où le registre change)
- [x] Ponctuation : aucun tiret long ajouté
- [x] TypeScript strict, zéro suppression
- [x] Documentation : `docs/modules/emotion_wheel.md` + `apps/mobile/docs/design-system.md`
- [ ] Rendu sur appareil réel : à confirmer visuellement (point d'attention 4)

## 📚 Enrichissement des règles

`lessons.md` déjà à jour : aucune violation bloquante. Le `DELETE` de la migration est
une application directe de la règle existante sur les seeds `DO UPDATE`, déjà
documentée dans `config-first.md`.
