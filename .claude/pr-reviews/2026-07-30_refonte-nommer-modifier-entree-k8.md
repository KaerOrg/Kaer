---
date: 2026-07-30
branch: refonte/nommer-modifier-entree-k8
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
files_modified: 14
rules_enriched: 0
---

# PR Review : refonte/nommer-modifier-entree-k8
Date : 2026-07-30 · Ticket #256 (K-8) · Base : branche de #279 (K-3)

## CI GitHub Actions

| Job | Statut |
|---|---|
| typecheck-web | ✅ |
| lint-web | ✅ (aucun fichier web touché) |
| test-web | ✅ 198 fichiers, 1253 tests |
| typecheck-mobile | ✅ |
| test-mobile | ✅ 189 suites, **1340 tests** |
| SQL (deno) | ⚠️ non exécutable localement (`deno` absent) |

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 2 |
| ✅ Conformes | 15 fichiers |

---

## 🚫 VETO MDR

Aucun. Un point mérite d'être noté du côté **intégrité de la donnée de soin**, qui est
la face « stockage » de la règle d'or : `INSERT OR REPLACE` réinsère la ligne, donc sans
`created_at` explicite, **corriger une faute de frappe dans une note aurait déplacé
l'entrée dans le temps**. Le praticien aurait relu en séance une entrée datée d'un autre
jour que celui vécu par le patient. C'est traité, testé, et documenté.

## 🚫 Violations bloquantes

Aucune.

---

## ⚠️ Points d'attention

### 1. Modifier une note oblige à re-choisir l'émotion

Le ticket dit « rouvre le parcours **pré-rempli à l'étape 1** ». Deux lectures :
ouvrir sur la fiche avec tout pré-rempli (pratique pour corriger une note, mais on ne
peut plus changer l'émotion ni nommer une entrée sans mot), ou repartir de l'étape 1
avec les champs facultatifs rechargés (retenu).

La seconde honore les deux autres critères du ticket ; la première les contredirait.
→ Conséquence assumée et signalée à l'utilisateur : **corriger seulement une note
demande de retraverser famille et nuance**. Une ligne à changer si l'arbitrage est
inverse.

### 2. Déclenchement par prop + jeton : un effet de synchronisation assumé

`editRequest` est une prop dont le `token` déclenche un `useEffect` qui remplit l'état
du flux. C'est un effet « props → state », habituellement un signal d'alarme. Ici il est
justifié : le primitive **possède** l'état du flux, et le parent doit pouvoir le
piloter impérativement (« rouvre ce brouillon »). L'alternative serait un
`useImperativeHandle`, plus lourd et moins testable.

Le `token` n'est pas décoratif : sans lui, rouvrir **deux fois la même entrée** ne
relancerait rien (l'objet serait identique). Un test verrouille ce cas précis.

---

## ✅ Points positifs

- **Le bug d'horodatage a été anticipé, pas découvert.** Il n'apparaît sur aucun écran :
  il se serait vu des semaines plus tard, sur une entrée qui aurait « changé de jour ».
  Le commentaire dans `database.ts` explique le mécanisme pour la prochaine personne.
- **La signature reste honnête** : `created_at?: string` en option, absent en création
  pour que le `DEFAULT CURRENT_TIMESTAMP` fasse son travail. Pas de valeur bidon.
- **Le contrat de sync suit** : `created_at` entre dans le payload seulement quand il
  est fourni, donc la même entrée ne change pas de jour côté serveur non plus. C'est
  exactement le cas vécu consigné dans `lessons.md` § « la donnée synchronisée doit
  porter le bon horodatage » (chronobiologie, PR #82), évité cette fois.
- **Le helper spéculatif a été retiré.** Une première version résolvait le chemin
  persisté en nœuds de l'arbre courant (`resolveUiPath`) ; le changement d'approche l'a
  rendu inutile et il a été supprimé plutôt que laissé « au cas où ».
- **7 tests**, dont deux cas limites que l'énoncé n'exigeait pas explicitement : une
  entrée sans mot réenregistrée telle quelle, et la réouverture répétée.

---

## Checklist finale

- [x] Modifier conserve l'identifiant et l'horodatage d'origine (testé de bout en bout)
- [x] Une entrée « Sans mot » peut recevoir une émotion par modification
- [x] Sync via `syncUpsert` / `syncDelete`, service inchangé hormis le payload
- [x] Config-first : le libellé de l'option vient du seed, migration miroir
- [x] i18n fr/en
- [x] Ponctuation : aucun tiret long ajouté (1 corrigé en review)
- [x] TypeScript strict, zéro suppression
- [x] Documentation : `docs/modules/emotion_wheel.md` + `apps/mobile/docs/design-system.md`

## 📚 Enrichissement des règles

`lessons.md` couvre déjà le motif (« la donnée synchronisée doit porter le bon
horodatage »). Le cas `INSERT OR REPLACE` en est une variante **locale** : la perte se
produit dans SQLite avant même la sync. Mérite une ligne dans cette section si le motif
se reproduit sur une autre table.
