---
date: 2026-08-03
branch: refonte/safety-sequence-etapes-p7
pr_number: 356
pr_url: https://github.com/KaerOrg/Kaer/pull/356
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
files_created: 0
files_modified: 19
rules_enriched: 1
---

# PR Review — refonte/safety-sequence-etapes-p7

Date : 2026-08-03 · Ticket #303 (P-7) · PR #356

## CI GitHub Actions

| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ 0 erreur (201 warnings préexistants) |
| test-web | `cd apps/web && npx vitest run` | ⚠️ 1488/1490 : 2 échecs **préexistants sur `main`** (`DashboardPage.invite-form`, dépassement de délai sous charge, verts en isolation) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 1440 |
| test-shared | `npm run test:shared` | ✅ 81 |

## Synchronisation avec main

Merge `origin/main` : propre (`Already up to date`, `main` n'a pas bougé pendant l'implémentation). Aucun conflit.

## Fichiers analysés

Créés : 0 · Modifiés : 19 (layout mobile + styles + test, layout web + test + CSS, `ModuleContentScreen` + test, 8 fichiers de locales, `seed.sql`, 2 docs)

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 2 |

## 🚫 VETO MDR

Aucun. L'invariant du socle est intact et renforcé : le routage ne reçoit toujours qu'un `ReadonlySet<string>` de sections non vides ; le sous-titre est du texte de configuration statique ; aucune couleur n'est pilotée par une donnée patient. Un **test statique ajouté** verrouille le fait que le layout ne lit ni `bgColor`, ni `icon`, ni `step_number` : ces props existent en base pour les vues Consultation et Édition, et les lire ici réintroduirait une couleur par étape dans un parcours qui n'en veut qu'une.

## ⚠️ Points d'attention

### `apps/mobile/.../SafetySequence/SafetySequenceLayout.tsx`

**Deux flèches de retour coexistent à l'écran.** L'en-tête natif de `ModuleContentScreen` porte sa propre flèche, à côté du retour d'étape du layout. Situation héritée du socle (#301), pas introduite ici. Elle appartient à #316 (P-1), qui possède le routage et le chrome de l'écran. Signalée dans le corps de la PR pour ne pas être découverte en recette.

**`onExit` n'est toujours pas câblé par le `LayoutDispatcher`** : « Je m'arrête là » ne fait rien aujourd'hui. Hors périmètre de #303 (le ticket ne demande que la présence du bouton), à traiter par #316.

## ✅ Points positifs

- **Design system respecté sans détour** : la carte de contenu passe par `ui/Card`, le retour par `ui/Button` en mode icône seule (`variant="ghost"`, `accessibilityLabel`, `hitSlop` fourni par le primitive). Aucun `Pressable` nu, aucun `View` à ombre faite main. C'est exactement la correction que le cas `mse-entry-slider` de `lessons.md` demandait de ne plus rater.
- **Config-first tenu sur un ajout qui aurait pu être en dur** : le sous-titre entre par `field_props.subtitle_code`, et la prop porte une clé i18n, pas le texte. Valeur atomique, conforme au garde-fou `fieldPropsAtomic` (vérifié : vert).
- **Seed en `ON CONFLICT DO UPDATE`** : l'ajout rejoint un `INSERT` déjà idempotent, garde-fou `seedIdempotency` vert.
- **Un bug de fond corrigé au passage, avec son test** : `safety_sequence` absent de `SELF_MANAGED_LAYOUTS` rendait les « actions ancrées » illusoires. Le critère d'acceptation « les boutons restent visibles à Dynamic Type 200 % » était faux avant cette PR.
- **Deux gardes statiques ajoutées**, dans l'esprit de celle du socle : le test relit le source et échoue si un geste de balayage ou une couleur d'étape y apparaît. Un test de parcours ne verrait ni l'un ni l'autre.
- **Parité web ≡ mobile faite dans le même commit**, depuis la même prop.

## Checklist finale

- [x] Zéro Supabase/SQLite dans les composants
- [x] TypeScript strict (zéro `any`, zéro cast, zéro suppression)
- [x] Zéro allocation inline (`BACK_ICON` au niveau module)
- [x] Architecture `ui/` vs `features/` respectée, alias `@ui`/`@theme`
- [x] Un seul composant par fichier
- [x] Design system — zéro valeur hardcodée (tokens `fontSize`, `spacing`, `colors` ; CSS web en `var(--…)`)
- [x] i18n — zéro texte en dur, fr + en + de/es/it/pt best-effort ; variante teen non requise (texte strictement identique au common, fallback voulu)
- [x] Config-first — sous-titre en base, `prop_value` atomique
- [x] MDR — aucun seuil, aucune interprétation, aucune couleur de jugement
- [x] Tests — 6 cas ajoutés, chaque comportement nouveau couvert
- [x] Documentation — `docs/modules/crisis_plan.md` (section « Un écran d'étape, et rien d'autre ») + `docs/module-engine.md` (entrée `safety_sequence`)

## 📚 Enrichissement des règles

`lessons.md` — nouvelle entrée sous « Design system : tokens » : le cas « un layout à actions ancrées rendu dans le ScrollView de l'écran ». Le pattern n'était couvert par aucune règle existante : `SELF_MANAGED_LAYOUTS` est une liste qu'on oublie de rejoindre, et l'oubli ne casse ni les tests ni la compilation, il dégrade seulement la mise en page à fort grossissement.
