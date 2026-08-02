---
date: 2026-08-02
branch: refonte/nommer-familles-k4
pr_number: 275
pr_url: https://github.com/KaerOrg/Kaer/pull/275
ci_pass: false
merge_clean: false
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 1
  tests: 0
  docs: 0
  design_system: 0
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 1
warnings: 3
files_created: 1
files_modified: 15
rules_enriched: 0
---

# PR Review — refonte/nommer-familles-k4
Date : 2026-08-02

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreurs, 200 warnings préexistants) |
| test-web | `cd apps/web && npx vitest run` | ✅ (202 fichiers, 1292 tests) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ❌ (2 échecs — flake préexistant sans rapport, voir ci-dessous) |

## Synchronisation avec main
**La branche avait divergé lourdement de `main`** : K-1 et K-10 étaient déjà mergés sur
`main` (#272 puis #334), avec migration des boutons TreeSelector vers `@ui/Button` +
passe d'accessibilité. La branche rejouait ces deux tickets sur une base périmée
(23/07), avec l'ancienne implémentation `Pressable + styles.xxxBtn`.

Résolution retenue (validée par l'utilisateur) : **rebase `--onto origin/main`** en
laissant tomber les 4 commits K-1 (redondants) ; le commit K-10 s'est effondré à une
addition de doc de 14 lignes (tout le reste déjà sur `main`), et **seul K-4** subsiste
comme delta réel.

- Conflits résolus (en gardant la structure `@ui/Button` de `main`) :
  `TreeSelectorHistory.tsx`, `TreeSelectorIntensity.tsx`, `TreeSelectorNotes.tsx`, `styles.ts`
- ⚠️ La branche est **rebasée en local, non poussée** : le push nécessite un
  `--force` (historique réécrit) → validation explicite requise avant tout push/commentaire PR.

## Fichiers analysés (delta K-4 après rebase)
- Créés : 1 (`supabase/migration_emotion_wheel_familles_k4.sql`) — hors rapport archivé
- Modifiés : 15 (TreeSelector primitive + layout + helpers + i18n + seed + docs)

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 1 |
| ⚠️ Points d'attention | 3 |
| ✅ Conformes | le reste du périmètre |

---

## 🚫 VETO MDR
Aucun. Les teintes codent l'**identité de famille** (jamais une gravité), l'intensité
reste un chiffre brut sans label/seuil, l'historique est neutre. Migration + doc
l'explicitent. Conforme.

---

## 🚫 Violations bloquantes

### i18n — parité teen manquante (`skip_btn`, `node_def.*`)

**`apps/mobile/src/i18n/locales/fr/teen.json` + `en/teen.json` — [i18n / mode ado]**
Le K-4 ajoute dans `fr/common` + `en/common` les clés `modules.emotion_wheel.skip_btn`
et `modules.emotion_wheel.node_def.{joy,sadness,anger,fear,disgust,self_conscious,powerful,peaceful}`
(8 définitions), mais **seul `stop_hint` a reçu sa variante teen**. `skip_btn` et les 9
clés `node_def.*` sont **absentes des deux `teen.json`**.

Le bloc teen d'`emotion_wheel` est par ailleurs **exhaustif** (il porte `node`,
`stop_hint`, `validate_here_btn`, tous les libellés applicatifs) — ce n'est donc pas une
convention « fallback assumé » mais un oubli. `node_def` est de surcroît une feature
**live** : les définitions s'affichent dès maintenant sous chaque famille.

Règle : *« Toutes les clés `modules.<id>.*` ajoutées dans `fr/teen.json` et `en/teen.json` »*
+ *« L'absence dans teen est un bug bloquant pour toute clé de module »*. `emotion_wheel`
n'est pas une échelle validée → aucune exemption.

→ Ajouter `skip_btn` et `node_def.*` aux deux `teen.json`. **Nuance** : le contenu est
à registre neutre (listes nominales « menace, incertitude » ; `skip_btn` = « Je ne sais
pas trop », 1ʳᵉ personne) — les variantes teen seront quasi identiques au common, mais
elles doivent exister pour tenir la parité (ou acter une exemption explicite en PR).

---

## ⚠️ Points d'attention

### `apps/mobile/src/components/ui/TreeSelector/TreeSelectorNavigation.tsx`

**Lignes 131-139 — [Design system]**
Le nouveau bouton `skipBtn` (« Je ne sais pas trop ») est un `Pressable + Text +
styles.skipBtn` natif. `ui/Button variant="ghost"` couvre un bouton-libellé fantôme ;
seul le liseré **pointillé** sort des variantes existantes.
→ Soit migrer vers `<Button variant="ghost" label={texts.skipBtn} onPress={onSkip} />`,
soit — si le pointillé « porte de sortie » est délibéré et non couvert — ajouter un
commentaire justifiant le natif, comme le fait déjà `cancelBtn`. Précédent : le frère
`validateHereBtn` est natif (mergé via #334), donc point d'attention et non bloquant.
Inerte jusqu'à K-7 (#255) mais il se rendra à ce moment.

### `supabase/seed.sql` + `TreeSelectorLayout.tsx`

**[Config-first / feature staging]**
Les `field_props` `skip_btn`/`stop_hint` (seed) et les `texts.skipBtn`/`texts.stopHint`
(layout) sont lus mais **jamais affichés** : le layout ne câble volontairement pas
`onSkip` (le parcours est le ticket #255 / K-7). L'intention est **documentée**
(message de commit + doc design-system : *« un arbre sans porte de sortie n'affiche pas
de bouton mort »*) et le primitive garantit qu'aucun bouton mort ne s'affiche — c'est
donc un choix défendable, pas un bug de câblage.
→ Confirmer que l'équipe assume d'expédier la config + l'i18n du skip **en avance** de
K-7 (sinon les livrer avec le câblage). La parité teen (ci-dessus) reste due quoi qu'il
arrive.

### `apps/mobile/src/components/features/ModuleRenderer/FieldRenderer.sleep_journal.test.tsx`

**Lignes 80-82 — [Tests — flake préexistant, HORS périmètre]**
La suite mobile est rouge (2 échecs), mais **dans un fichier non touché par la branche**
et testant le module `sleep_journal` (sans rapport avec emotion_wheel). Le test dérive
`yesterdayStr()` de `new Date()` **sans `jest.useFakeTimers`/`setSystemTime`** → il
dépend de l'horloge réelle et casse au passage de minuit (la session a franchi le
2026-08-02). Identique sur `main`, donc **non introduit par K-4**.
→ À corriger dans un ticket dédié (figer l'horloge). Non bloquant pour cette PR.

---

## ✅ Points positifs

- **Rebase propre** : K-1/K-10 (déjà sur `main` via #272/#334) écartés ; la structure
  `@ui/Button` de `main` est **préservée** — aucune régression vers les boutons ad hoc.
- **`toEntryVM` relit teinte + icône dans la taxonomie courante** (`nodeMap`) sans jamais
  réécrire le `path` persisté du patient : une entrée antérieure à la pastellisation
  s'affiche avec la nouvelle teinte, la donnée brute reste intacte. MDR-conforme, bien
  documenté, **et testé** (y compris le repli quand la famille a disparu du seed).
- **Retrait de l'emoji du primitive** : `emotion_wheel` en est le **seul** consommateur
  (`preview_kind='tree_selector'`), le retrait est donc une simplification sûre, bien
  argumentée (un emoji est déjà une interprétation — cohérent MDR).
- **Migration idempotente** : `ON CONFLICT … DO UPDATE` sur les inserts + `DELETE`
  explicite des lignes `emoji` (qu'un seed ne peut pas retirer) — exactement le pattern
  attendu par `config-first.md`.
- **Couverture de tests solide** : définition rendue, `accessibilityLabel` (titre +
  définition), visibilité du skip conditionnée à `onSkip`, skip au niveau 1 uniquement,
  re-résolution de taxonomie + repli.
- **Docs à jour dans le même commit** : `docs/modules/emotion_wheel.md` (tableau familles
  refondu) + `design-system.md` (props `definition`/`onSkip` avec section réelle) +
  charte a11y K-10.
- Teintes pastel **justifiées WCAG AA** (le doc chiffre les ratios) et cadrées MDR.

---

## Checklist finale
- [x] MDR 2017/745 — aucun seuil/alerte/interprétation
- [x] Zéro Supabase/SQLite dans les composants
- [x] TypeScript strict (zéro any/unknown/suppression)
- [x] Zéro allocation inline nouvelle (patterns préexistants du primitive)
- [x] Architecture ui/ vs features/ respectée (emoji retiré proprement, def injecté par props)
- [x] Un seul composant par fichier
- [x] Design system — `@ui/Button` préservé ; **[⚠️] `skipBtn` natif** (point d'attention)
- [ ] **i18n — parité teen : `skip_btn` + `node_def.*` manquants (bloquant)**
- [x] Sécurité — aucune nouvelle table (data-only) ; RLS inchangée
- [x] Schéma — pas de DDL (field_props uniquement)
- [x] Config-first — contenu en base ; migration idempotente + DELETE emoji
- [x] Parité graphique web ≡ mobile — N/A (pas de graphique ; emotion_wheel inchangé côté web)
- [x] Documentation + tests livrés pour le delta K-4
