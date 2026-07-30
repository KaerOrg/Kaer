---
date: 2026-07-30
branch: refonte/nommer-fiche-unique-k6
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
files_modified: 21
rules_enriched: 0
---

# PR Review : refonte/nommer-fiche-unique-k6
Date : 2026-07-30 · Ticket #254 (K-6) · Base : branche de #276 (K-5)

## CI GitHub Actions

| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (aucun fichier web touché) |
| test-web | `cd apps/web && npx vitest run` | ✅ 198 fichiers, 1253 tests |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 189 suites, **1316 tests** |
| SQL (deno) | `deno test supabase/tests/` | ⚠️ non exécutable localement (`deno` absent) |

## Synchronisation

Basée sur `refonte/nommer-nuances-k5` (#276). **Ordre : #272 → #273 → #275 → #276 → celle-ci.**

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 3 |
| ✅ Conformes | 23 fichiers |

---

## 🚫 VETO MDR

Aucun, et deux gains nets :

1. **Aucune valeur d'intensité par défaut.** L'ancien flux pré-cochait le centre de la
   plage (`midIntensity`). Une valeur pré-cochée sur un champ facultatif est une
   **réponse que le patient n'a pas donnée**, enregistrée comme s'il l'avait donnée.
   L'intensité démarre désormais à `null`, et re-taper le cran actif le désélectionne :
   le caractère facultatif tient de bout en bout, pas seulement avant le premier tap.
2. **Les saisies existantes ne sont pas recalculées** par le passage de 1-10 à 1-5.
   Convertir un 7/10 en 3,5/5 fabriquerait une valeur inexistante : la règle d'or dit
   que l'app enregistre et restitue.

Les ancrages « à peine » / « au maximum » bornent l'échelle sans qualifier aucune
valeur. Aucune couleur de seuil, aucun label interprétatif.

## 🚫 Violations bloquantes

Aucune.

---

## ⚠️ Points d'attention

### 1. Nouvelle colonne SQLite `context_other` : pourquoi pas dans `context`

La solution la plus courte aurait été d'ajouter le texte libre au tableau `context`.
Elle a été écartée : `context` ne contient que des **clés i18n**, résolues par `t()` à
l'affichage. Un texte patient qui tomberait par hasard sur une clé existante serait
**traduit**, c'est-à-dire remplacé par autre chose que ce que le patient a écrit. La
colonne dédiée coûte un `ALTER TABLE` (idiome déjà en place dans `database.ts`) et une
clé de plus dans le payload de sync.
→ **Côté Supabase, `patient_entries.payload` est un `jsonb` opaque** : aucune migration
serveur n'est nécessaire. Le web le lira quand #262 (W-2) construira sa couche de
lecture.

### 2. Trois composants supprimés : vérifier qu'aucun consommateur externe n'existait

`TreeSelectorIntensity`, `TreeSelectorContext` et `TreeSelectorNotes` sont supprimés.
Ils n'étaient exportés par aucun barrel (`index.ts` n'expose que `TreeSelector` et les
types) et n'étaient rendus que par `TreeSelector.tsx`. `tsc` et les 189 suites
confirment. La suppression est donc sans effet de bord, mais elle est irréversible sans
`git revert` : signalée à ce titre.

### 3. Le mode `entry` s'affiche même si les trois sections sont désactivées

`hasEntrySheet` retombe sur un enregistrement direct quand `enableIntensity`,
`enableContext` et `enableNotes` sont tous faux : la fiche vide n'est jamais rendue.
Comportement testé indirectement par les cas à config réduite ; pas de test dédié.
→ Aucun module n'est dans cette configuration aujourd'hui.

### 4. Le libellé « Force » remplace « Quelle intensité ? »

La maquette E6 titre la section **FORCE**. C'est plus court, mais c'est aussi un
changement de vocabulaire clinique qui n'était pas explicitement dans la table de
rédaction de K-10. Aligné sur la maquette, à confirmer par le clinicien.

---

## ✅ Points positifs

- **Le bug de config morte a été évité proprement** : la garde `useTeen.test.ts` a
  refusé une chaîne vide dans `en/teen.json` (`intensity_hint: ""`). Plutôt que de
  contourner la garde, la prop a été **retirée** du contrat, des quatre locales, du
  seed et de la migration : l'indice n'est plus affiché, il n'a plus à exister.
  La garde a fait exactement son travail.
- **`Chip` réutilisé** pour les chips de contexte et le déclencheur « + Autre », avec
  `color={colors.primaryDark}` plutôt que `primary` : le libellé sélectionné passe ainsi
  AA (≈ 5.5:1 sur `primaryLight`) là où `primary` échouait à ≈ 2:1. Le primitive n'a pas
  eu besoin d'être modifié, sa prop `color` suffisait.
- **Un fichier = un composant** : la fiche vit dans `TreeSelectorEntrySheet.tsx`, pas
  ajoutée à un fichier existant.
- **13 tests ajoutés ou réécrits**, dont quatre qui verrouillent des invariants MDR :
  aucune présélection d'intensité, désélection possible, ancrages présents, et le texte
  libre séparé des codes i18n.
- **La machine d'état perd deux modes** (5 → 3) et deux handlers de confirmation
  (`handleConfirmIntensity`, `handleConfirmContext`) : moins de chemins, moins
  d'invariants à tenir.

---

## Checklist finale

- [x] Une saisie complète = 3 taps (famille, nuance sans mots, enregistrer)
- [x] Aucun champ obligatoire hormis la famille
- [x] Aucune couleur ni label de seuil sur l'intensité
- [x] « + Autre » ouvre un champ libre et le stocke comme contexte
- [x] i18n fr/en common + teen, aucune chaîne vide
- [x] Ponctuation : aucun tiret long ajouté (3 corrigés en review)
- [x] TypeScript strict, zéro suppression
- [x] Sync : le contexte libre voyage dans le payload (`syncUpsert` inchangé), testé
- [x] Documentation : `docs/modules/emotion_wheel.md` + `apps/mobile/docs/design-system.md`

## 📚 Enrichissement des règles

`lessons.md` déjà à jour. Un incident de manipulation mérite toutefois d'être noté ici
pour mémoire : un `Get-Content | Set-Content -Encoding utf8` sur un fichier de test a
corrompu 19 caractères accentués (PowerShell relit en ANSI par défaut). Le fichier a été
restauré par `git checkout` et les modifications refaites avec l'outil d'édition. **Ne
jamais faire de substitution de masse sur un fichier accentué via PowerShell.**
