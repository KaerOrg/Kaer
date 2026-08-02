---
date: 2026-07-30
branch: refonte/nommer-sans-mot-k7
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
files_modified: 16
rules_enriched: 0
---

# PR Review : refonte/nommer-sans-mot-k7
Date : 2026-07-30 · Ticket #255 (K-7) · Base : branche de #277 (K-6)

## CI GitHub Actions

| Job | Statut |
|---|---|
| typecheck-web | ✅ |
| lint-web | ✅ (aucun fichier web touché) |
| test-web | ✅ 198 fichiers, 1253 tests |
| typecheck-mobile | ✅ |
| test-mobile | ✅ 189 suites, **1322 tests** |
| SQL (deno) | ⚠️ non exécutable localement (`deno` absent) |

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 2 |
| ✅ Conformes | 17 fichiers |

---

## 🚫 VETO MDR

Aucun. Le ticket est même **un gain de conformité par construction** : il retire une
contrainte implicite (« il faut nommer une émotion pour enregistrer ») qui poussait le
patient à choisir un mot au hasard. Une donnée choisie au hasard est pire qu'une donnée
absente : elle a l'air exploitable. Le filet gris neutre de l'entrée sans mot évite par
ailleurs de lui attribuer la teinte d'une famille qu'elle n'a pas.

## 🚫 Violations bloquantes

Aucune.

---

## ⚠️ Points d'attention

### 1. `selected_id` reste `NOT NULL` : le critère est tenu en intention, pas à la lettre

Le ticket demande une entrée « sans `selected_id` ». La colonne SQLite est
`TEXT NOT NULL` depuis l'origine, et SQLite exige une **reconstruction de table** pour
lever la contrainte (create / copy / drop / rename). Sur une table de données patient,
pour un gain formel, le rapport risque-bénéfice est mauvais.

Choix retenu : constante nommée `WORDLESS_SELECTED_ID = ''`, et c'est le **chemin vide**
qui porte la sémantique dans tout le code (`path.length === 0`). Aucun code ne teste la
chaîne vide pour décider quoi que ce soit : le marqueur reste cantonné à la persistance.
→ Si la colonne doit devenir réellement nullable, cela mérite un ticket avec migration
de table testée. Documenté dans `docs/modules/emotion_wheel.md`.

### 2. Le nombre de props de config de `ew.cfg` continue de croître

`enable_wordless`, `wordless_title`, `wordless_hint`, `wordless_label` portent le total
à une trentaine de props pour ce seul module. C'est le prix du config-first et c'est
assumé, mais la config d'`emotion_wheel` devient le plus gros bloc du seed.
→ Rien à corriger. Signalé pour qu'une future revue d'ensemble sache où regarder si la
lecture de config devient un sujet.

---

## ✅ Points positifs

- **La porte de sortie est une capacité du primitive, pas un cas particulier du
  module** : `allowWordless` est un booléen de config, et l'API du primitive est passée
  d'un callback (`onSkip`) à une **autorisation** (`allowWordless`). C'est plus juste :
  le primitive sait déjà quoi faire, il lui manquait la permission. L'appelant n'a plus
  à câbler un handler qu'il ne contrôle pas.
- **Le refus d'un chemin vide est conservé là où il protège** : `submit` prend un
  paramètre `wordless` explicite, et le layout vérifie `config.enableWordless` avant de
  persister. Deux gardes indépendantes, aucune ouverture générale.
- **Le filet gris n'est pas une couleur inventée** : `colors.border`, déjà le token des
  éléments neutres. Aucun hex en dur.
- **6 tests ajoutés**, dont un qui vérifie l'**absence** d'un message d'échec (critère
  d'acceptation formulé négativement, donc facile à « cocher » sans le tester).
- **Le helper gagne au passage un test qui manquait** à #277 : le contexte libre fermant
  la liste des chips sans passer par `t()`.

---

## Checklist finale

- [x] MDR : renforcé, aucune interprétation, filet neutre
- [x] i18n : fr/en common + variante teen tutoyée du sous-titre
- [x] Config-first : quatre props en base, seed et migration miroirs, valeurs atomiques
- [x] Ponctuation : aucun tiret long ajouté (1 corrigé en review)
- [x] TypeScript strict, zéro suppression
- [x] Tests : 6 cas, dont le critère négatif
- [x] Documentation : `docs/modules/emotion_wheel.md` + `apps/mobile/docs/design-system.md`
- [x] Sync : le chemin vide traverse `syncUpsert` sans traitement particulier

## 📚 Enrichissement des règles

`lessons.md` déjà à jour : aucune violation bloquante.
