---
date: 2026-08-03
branch: refonte/safety-etape6-web-pw4
pr_number: null
pr_url: null
ci_pass: true
merge_clean: true
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 0
  tests: 2
  docs: 0
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
warnings: 1
files_created: 13
files_modified: 24
rules_enriched: 1
---

# PR Review : refonte/safety-etape6-web-pw4 (PW-2 #321, PW-3 #322, PW-5 #324)
Date : 2026-08-03

## CI GitHub Actions (commandes exactes du workflow)

| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ 0 erreur, 0 warning sur le périmètre |
| test-web | `cd apps/web && npx vitest run` | ✅ 1598 tests |
| test-shared | `cd packages/shared && npx vitest run` | ✅ 101 tests |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 1459 tests |
| test-edge / test-sql | `deno test …` | ⚠️ non exécutés : Deno absent de la machine. Les tests SQL chargent `schema.sql` dans pglite ; l'ajout est deux `alter table … add column if not exists`, syntaxe déjà employée dans le fichier. |

## Synchronisation avec main

- Merge `origin/main` : propre (`Already up to date`).
- Fichiers en conflit résolus : aucun.

## Fichiers analysés

- Créés : 13 (dont 6 fichiers de test)
- Modifiés : 24
- Supprimés : 3 (`CrisisPlanConfigPanel` + son test, `PlanItemRow` remplacé par les cellules de tableau)

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 2 (corrigées avant clôture) |
| ⚠️ Points d'attention | 1 (justifié en commentaire) |
| ✅ Conformes | le reste du périmètre |

---

## 🚫 VETO MDR

Aucun. Vérifications explicites, chacune couverte par un test :

- **Aucun pourcentage de complétion.** `countFilledSteps` renvoie deux entiers bruts et
  jamais leur rapport ; un test verrouille le fait que l'objet retourné n'expose que
  `filled` et `total`, et un autre que le rendu ne contient aucun `%`.
- **Aucune date comparée à aujourd'hui.** `last_reviewed_at` est affichée, jamais
  surveillée. Un test rend l'en-tête avec une revue de 2024 puis avec « hier » et compare
  les classes CSS produites : elles sont identiques, donc aucune couleur, aucun badge,
  aucune alerte d'ancienneté ne peut apparaître.
- **Aucune valeur déduite du contenu.** `kind` n'est jamais inféré du texte de l'item ; le
  sélecteur n'a aucune valeur présélectionnée (extension `value={null}` de
  `SegmentedControl`), et un test le vérifie sur un item ancien.
- **Aucune suggestion pré-remplie**, **aucune suppression sans annulation** (l'item est
  réécrit tel quel, identifiant compris), **aucun rouge** sur un item sans numéro : la
  mention est neutre et dit la conséquence côté patient.

---

## 🚫 Violations bloquantes (corrigées)

### `apps/web/src/pages/PatientPage/hooks/useCrisisPlanSummary.ts`

**[Tests]** Hook créé sans son test direct.
→ Corrigé : `useCrisisPlanSummary.test.tsx` (5 cas), dont celui qui verrouille le problème
d'origine du ticket : un plan vide n'est pas « personnalisé », quel que soit le message de
soutien.

### `apps/web/src/pages/PatientPage/panels/PlanItemTextCell.tsx`

**[Tests]** Composant portant la logique la moins évidente du lot (comparaison à la valeur
initiale, garde « le texte ne devient jamais null », remontée de la valeur serveur) couvert
seulement indirectement par `StepDetailPanel.test.tsx`.
→ Corrigé : `PlanItemTextCell.test.tsx` (9 cas). Rappel de
[lessons.md § Tests et couverture](../rules/lessons.md) : une couverture d'intégration ne
remplace pas le test direct d'un composant à logique.

---

## ⚠️ Points d'attention

### `apps/web/src/pages/PatientPage/panels/SafetyPlanEditorPanel.tsx`

**[Couches]** Ce panneau possède ses propres lectures et mutations, alors que ses voisins de
`tabs/` (`RimConfigPanel`, `MedicationListConfigPanel`…) reçoivent un hook d'édition
construit par `PatientModulesTab`.

Divergence **délibérée**, justifiée en tête de fichier : ce n'est pas une feuille mais un
panneau complet, dont les propres enfants sont strictement présentationnels (données +
callbacks par props, zéro service, zéro store, zéro toast) ; et le ticket exige que les
lectures passent par les factories `hooks/queries/` plutôt que par un `useEffect` de fetch.
Faire transiter une dizaine de mutations par un `PatientModulesTab` déjà très long
n'apporterait rien.

---

## ✅ Points positifs

- **Extension d'un primitive plutôt que duplication** : `SegmentedControl` reçoit
  `value: T | null` (aucun segment actif) au lieu d'un sélecteur parallèle. Documenté dans
  le design system, couvert par deux tests.
- **Contrat partagé web ≡ mobile** : `PlanItemKind` et `readStepColumns` vivent dans
  `@kaer/shared` ; `apps/mobile/src/lib/database.ts` ré-exporte le type au lieu de le
  redéclarer. Le web ne peut plus diverger du mobile sur la nature d'un item.
- **Zéro `as`** sur un type venu du serveur : `parsePlanItemKind` vérifie à l'exécution ce
  que la base ne garantit pas (colonne `text`), et un item d'avant P-14 se lit `null`.
- **Config-first tenu de bout en bout** : les six étapes, leurs colonnes, l'orientation vers
  l'éditeur de mesures et les propositions de verbe viennent tous de `module_content_fields`
  / `field_props`. Aucun numéro d'étape, aucun `module_id` en dur ; un test rend le panneau
  avec `moduleId="autre_plan"` et vérifie qu'aucune clé `modules.crisis_plan.*` n'apparaît.
- **Nouvelle prop de config atomique** : `mixed_kind = 'true'` sur le `step_title` de
  l'étape 3, en `ON CONFLICT DO UPDATE`, sans valeur packée.
- **Deux écritures corrompues attrapées par les tests** avant tout rendu manuel (voir la
  leçon ajoutée) : un item écrit avec `section_id: ''`, et `created_with_at` réécrit avec la
  date du jour. Les deux venaient d'un contrôle utilisable avant la réponse de sa requête.

---

## Passe `simplify`

| Retouche | Fichiers |
|---|---|
| `PlanStateHeader` reçoit des phrases déjà composées au lieu de trois fonctions de composition : il affiche, il n'assemble plus rien | `PlanStateHeader.tsx`, `PlanStateHeader.test.tsx`, `SafetyPlanEditorPanel.tsx` |
| Les options du sélecteur de nature dérivent de `PLAN_ITEM_KINDS` au lieu de répéter les littéraux `'person'` / `'place'` | `SafetyPlanEditorPanel.tsx` |
| Le libellé de la colonne « note » est calculé une fois au lieu d'être dupliqué entre `columnLabels` et `formLabels` | `SafetyPlanEditorPanel.tsx` |

CI relancée après la passe : les six jobs exécutables restent verts.

---

## 📚 Documentation enrichie

- `lessons.md` : nouvelle section « Un formulaire rendu avant sa configuration écrit des
  données fausses » (2 cas vécus sur cette branche). Le pattern n'était couvert par aucune
  règle existante : la valeur de repli (`''`, `null`) rend le code typé et non plantant,
  donc rien ne signale l'anomalie.
