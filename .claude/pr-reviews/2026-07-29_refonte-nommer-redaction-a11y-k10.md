---
date: 2026-07-29
branch: refonte/nommer-redaction-a11y-k10
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

# PR Review : refonte/nommer-redaction-a11y-k10
Date : 2026-07-29 · Ticket #258 (K-10) · Base : branche de #272 (K-1)

## CI GitHub Actions

| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ 0 erreur (200 warnings préexistants) |
| test-web | `cd apps/web && npx vitest run` | ✅ 198 fichiers, 1253 tests |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 189 suites, 1293 tests (+4) |
| SQL (deno) | `deno test supabase/tests/` | ⚠️ **non exécuté** : `deno` n'est pas installé sur ce poste. Les deux suites (`schemaFunctions`, `retentionPurge`) ne touchent ni `field_props` ni le seed du module ; la CI les exécutera. |

## Synchronisation avec main

- Branche basée sur `refonte/nommer-ce-que-je-ressens-k1` (PR #272), pas sur `main` :
  les deux tickets écrivent dans les mêmes fichiers de locales. **À fusionner après #272.**
- Merge `origin/main` : propre.

## Fichiers analysés

- **Créés** : 1 (`supabase/migration_emotion_wheel_redaction_k10.sql`)
- **Modifiés** : 17 (4 locales, 8 sources mobile, 1 seed, 2 docs, 1 test, 1 hook)

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 3 |
| ✅ Conformes | 18 fichiers |

---

## 🚫 VETO MDR

Aucun. La passe **renforce** la conformité : la couleur de famille ne porte plus de
texte (elle identifie, elle ne qualifie pas), et l'intensité reste un chiffre brut,
désormais sur fond neutre (`colors.neutral`) au lieu d'un fond teinté par la famille.
Aucun seuil, aucun label interprétatif, aucune alerte introduits.

## 🚫 Violations bloquantes

Aucune.

---

## ⚠️ Points d'attention

### 1. Critère « une seule flèche retour par écran » : volontairement différé à #251 (K-3)

Le ticket #258 porte ce critère, mais la flèche de `TreeSelectorHeader` est
aujourd'hui **le seul moyen de remonter d'une étape** dans le flux (la flèche native
sort du module). La supprimer maintenant casserait la navigation. #251 restructure
l'accueil et le flux : c'est là que la déduplication a un sens. Signalé plutôt que
coché à tort.

### 2. Parité web ≡ mobile temporairement rompue sur le bouton « valider ici »

Le layout web `TreeSelectorLayout` (aperçu praticien) affiche encore
« Valider à ce niveau : Effroi » : il a sa propre implémentation et son propre bag de
textes, et ne lit pas `validate_here_keep`. La nouvelle prop de seed est simplement
inutilisée côté web, sans rien casser. La résorption est prévue par #267 (W-7,
`EmotionNamingPatientView`), qui remplace l'aperçu générique.
→ Conformément à la consigne de l'epic (« si un changement de seed impose une mise à
jour de parité, signale-le avant de le faire »), **le web n'a pas été touché**.

### 3. Deux `aria-label="back"` en dur subsistent, hors de ce module

Le défaut relevé en revue de PR #82 est **déjà corrigé** pour ce module : le layout
web `TreeSelectorLayout` passe `back: t('common.back')`. En revanche il subsiste dans
un autre module :

```
apps/web/src/components/features/ModuleRenderer/layouts/ExposureTrackerLayout/ExposureStepDetailView.tsx:23
apps/web/src/components/features/ModuleRenderer/layouts/ExposureTrackerLayout/ExposureFormView.tsx:24
```

→ Même défaut (libellé lu par les lecteurs d'écran, figé en anglais dans une app FR),
mais **autre module, autre epic** : signalé, pas embarqué. Mérite un ticket dédié.

### 4. `ui/Button` (mobile) porte le même défaut de contraste, à l'échelle de l'app

`Button.styles.ts:30` pose `primaryLabel: { color: colors.white }` sur un fond
`colors.primary` : c'est exactement le ratio ≈ 2.1:1 que ce ticket corrige dans
`ui/TreeSelector`. Le primitive n'est pas utilisé par ce module, donc le critère
« zéro texte sous AA **dans le module** » est satisfait sans y toucher. Mais **tous
les autres écrans mobile** sont concernés.
→ Non embarqué : repeindre le libellé de chaque bouton primaire de l'app dépasse de
loin un ticket de module et doit être vu à part. Idem pour `secondaryLabel` /
`ghostLabel` (`colors.primary` en texte sur fond clair, même ratio).

---

## ✅ Points positifs

- **Le libellé concaténé disparaît proprement.** « Valider à ce niveau : Effroi »
  n'est pas remplacé par un autre bricolage de chaîne : le niveau conservé passe en
  ligne secondaire, alimentée par une **prop de config** (`validate_here_keep`) et
  une interpolation i18next `{{label}}`. Aucun texte en dur, aucune concaténation
  dans le composant.
- **Config-first tenu** : la nouvelle prop atterrit dans `seed.sql` **et** dans une
  migration idempotente miroir, avec `ON CONFLICT … DO UPDATE`. Valeur atomique
  (une clé i18n), conforme à la règle `field_props`.
- **Le réordonnancement des chips ne casse aucune donnée** : seuls les indices
  `context_opt_N` bougent, les codes i18n restent identiques, donc une entrée déjà
  saisie garde son contexte. C'est écrit en commentaire dans la migration.
- **Le hook partagé est élargi, pas dupliqué** : `useModuleTranslation` accepte
  désormais des valeurs d'interpolation via un type nommé
  (`ModuleTranslationValues`), sans `any` et sans casser les appelants existants ni
  leurs mocks `(k) => k`.
- **Tests ajoutés là où le comportement change** : 4 cas neufs couvrent le libellé du
  bouton, son étiquette d'accessibilité, l'absence de couleur de famille sur les
  textes, et l'annonce de sélection des crans d'intensité.
- **Tokens** : `styles.ts` ne contient plus de couleur hexadécimale en dur
  (`'#F3F4F6'` → `colors.neutral`), plus de bloc d'ombre recopié (`...shadows.sm`),
  et plus de taille de police numérique (`fontSize.*`).

---

## Checklist finale

- [x] MDR 2017/745 : renforcé, aucune couleur de gravité, intensité brute
- [x] i18n : zéro texte en dur, parité fr/en common et teen
- [x] Registre teen : tutoiement professionnel, aucun mot familier introduit
- [x] Ponctuation : aucun tiret long dans les lignes ajoutées (2 corrigés en review)
- [x] TypeScript strict : zéro `any`, zéro `as unknown`, zéro suppression
- [x] Design system : tokens partout, aucune valeur hardcodée, primitive étendu (pas dupliqué)
- [x] Config-first : nouvelle prop en base, seed et migration miroirs et idempotents
- [x] Tests : 4 cas ajoutés sur le comportement modifié
- [x] Documentation : `apps/mobile/docs/design-system.md` (charte + prop) et `docs/modules/emotion_wheel.md`
- [ ] Une seule flèche retour par écran : **différé à #251**, motif ci-dessus
- [ ] Parité web ≡ mobile sur le bouton « valider ici » : **différée à #267**, motif ci-dessus

## 📚 Enrichissement des règles

`lessons.md` déjà à jour : aucune violation bloquante à consigner. Les quatre points
d'attention sont des reports de périmètre assumés et de la dette préexistante hors
module, pas des patterns fautifs introduits par cette branche.
