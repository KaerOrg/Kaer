---
date: 2026-06-25
branch: refonte/roue-des-emotions
pr_number: 82
pr_url: https://github.com/KaerOrg/Kaer/pull/82
ci_pass: true
merge_clean: true
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
  teen_mode: 0
warnings: 5
files_created: 4
files_modified: 19
rules_enriched: 2
---

# PR Review — refonte/roue-des-emotions (#82)
Date : 2026-06-25

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreurs, 198 warnings pré-existants `jsx-no-bind`) |
| test-web | `cd apps/web && npx vitest run` | ✅ (860 passed, 6 skipped) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ (877 passed)¹ |

¹ Un premier run lancé **en parallèle** des tests web a produit un faux échec (erreur de parse Babel par contention de ressources/cache). Relancé seul : 116 suites, 877 tests verts.

## Synchronisation avec main
- Merge `origin/main` : **propre** (auto-merge sans conflit, commit `625240d`).
- Fichiers en conflit résolus : aucun.

## Fichiers analysés
- Créés : 4 (TreeSelectorHeader.tsx, web TreeSelectorLayout.test.tsx, migration SQL, docs/spec)
- Modifiés : 19

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 1 |
| ⚠️ Points d'attention | 5 |
| ✅ Conformes | reste du scope sans remarque |

---

## 🚫 VETO MDR
Aucun. La refonte est **exemplaire côté MDR** : couleurs/emojis codent l'identité de
famille (jamais une gravité), intensité brute 1–10 affichée sans seuil ni label
interprétatif, aucune notification conditionnée aux données. Le commentaire de tête de
la migration documente explicitement cette conformité. Le CSS **retire même** l'ancien
rouge `#DC2626`/`#FEE2E2` qui colorait l'intensité (`.ts-history-card__intensity`).

---

## 🚫 Violations bloquantes

### `apps/web/src/components/features/ModuleRenderer/layouts/TreeSelectorLayout/TreeSelectorLayout.tsx`

**Ligne 106 — [i18n] Texte en dur dans un `aria-label`.**
```tsx
<button type="button" className="ts-back" onClick={back} aria-label="back"><ArrowLeft size={20} /></button>
```
`aria-label="back"` est une chaîne anglaise codée en dur, lue par les lecteurs d'écran
dans une app dont la langue par défaut est le français. La clé existe déjà
(`common.back` = « Retour » / « Back ») et le **mobile équivalent l'utilise** déjà
(`TreeSelectorHeader.tsx:25` → `t('common.back')`) — c'est donc aussi une rupture de
parité accessibilité.
→ `aria-label={t('common.back')}`.

---

## ⚠️ Points d'attention

### `apps/web/.../TreeSelectorLayout/TreeSelectorLayout.tsx` — boutons natifs vs `ui/Button`

Le layout (réécrit en aperçu interactif) est légitimement bâti sur des `<button>`
natifs **dynamiquement teintés** par la couleur de la famille d'émotion
(`ts-primary`, `ts-option`, `ts-chip`, `ts-intensity__btn`, `ts-validate`, `ts-save`,
`ts-continue`) — `ui/Button` (variants fixes `primary/secondary/danger/ghost/outline`,
`category` énuméré) ne sait pas porter un fond/bordure en couleur arbitraire, donc le
natif est **défendable** pour ceux-là.

En revanche deux boutons n'ont **aucune teinte dynamique** et dupliquent proprement
`ui/Button` :
- **Ligne 282 `ts-cancel`** (neuf) — bouton neutre → `ui/Button variant="secondary"`.
- **Ligne 127 `ts-new-btn`** (pré-existant, `background: var(--color-primary)` + icône `Plus`) → `ui/Button variant="primary" icon={<Plus/>}`.

→ Migrer au moins ces deux-là. Pour les boutons à accent dynamique, idéalement
**étendre `ui/Button`** (passe-plat d'accent/`style`) ou laisser un commentaire
justifiant l'absence de variante (cf. coding-standards § « cas particulier — pas de
variante exacte »). *(Non bloquant : le scope dominant du fichier est un idiome local
cohérent d'accents dynamiques mirroir du mobile.)*

### `apps/web/.../TreeSelectorLayout.tsx:250` — `ts-chip` natif alors que le mobile consomme `ui/Chip`
Le mobile rend les chips de contexte via le primitive `<Chip>` (ligne 614 du layout
mobile) ; le web réimplémente un `<button className="ts-chip">`. Incohérence de
**parité d'approche** : vérifier si `ui/Chip` (web) couvre l'état actif teinté, et
l'utiliser le cas échéant.

### `apps/mobile/.../TreeSelector/TreeSelectorLayout.tsx:502` — `validateHereBtn` ad hoc
Nouveau bouton `Pressable + icône + Text + styles.validateHereBtn` (accent dynamique).
Suit l'idiome pré-existant du fichier (`startBtn`/`continueBtn`/`saveBtn`/`cancelBtn`,
tous ad hoc). Même recommandation que ci-dessus : à terme, primitive `ui/Button` mobile
avec accent, ou justification. *(Dette d'idiome pré-existante, pas une régression.)*

### `apps/mobile/.../TreeSelector/TreeSelectorHeader.tsx` — pas de test unitaire direct
Le composant créé (présentationnel : flèche retour + barre de progression) n'a pas de
`TreeSelectorHeader.test.tsx`. Il est **réellement couvert** (non mocké) par les flux de
navigation de `FieldRenderer.tree_selector.test.tsx` (back/cancel/valider-ici). Vu sa
trivialité, acceptable — mais un test de rendu direct (`testID="back-button"` +
`progressFill` à `width` selon `progress`) serait plus propre.

### `docs/spec/refonte-roue-emotions.md` — spec non indexée
Le nouveau document de spec n'est référencé ni dans `docs/README.md` ni dans
`docs/modules.md`. Ajouter un lien d'index (cf. CLAUDE.md « doc parfaitement indexée »).

---

## ✅ Points positifs

- **Deux `eslint-disable-next-line react-hooks/exhaustive-deps` supprimés** (mobile
  `handleSelectNode`, `handleDelete`) au profit de deps correctes (`proceedFrom`, `lbl`) —
  corrige directement un cas de `lessons.md § Suppressions interdites`.
- **config-first exemplaire** : toute la taxonomie Willcox (8/37/74) + config vit en
  `module_content_fields`/`field_props`. `field_props` **atomiques** : options de
  contexte en clés indexées `context_opt_N`/`context_icon_N` lues par `collectIndexed`
  (`@kaer/shared`, parité web ≡ mobile), zéro packing CSV/`:`/JSON.
- **Migration idempotente** (purge + ré-insert, `on conflict do update/nothing`) ;
  `seed.sql` mis à jour en miroir (source de vérité) ; `database.ts` couvre BDD fraîche
  (`createTreeSelectionsTable`) **et** existante (`ALTER TABLE … ADD COLUMN context_json`
  gardé par try/catch).
- **Sync** : `saveTreeSelection`/`deleteTreeSelection` passent par `syncUpsert`/
  `syncDelete` ; `context` répliqué dans le payload ; mock `RemoteSyncService` présent
  dans le test du service.
- **i18n complète** : parité 149/149 (web+mobile common) ; 147 clés de contenu en teen
  (fr+en) avec **vrai tutoiement** (`label`/`description` catalogue volontairement
  common-only, convention établie).
- **Couverture** : 17 cas mobile + 5 cas web couvrant le nouveau flux contexte, le
  « valider ici » (profondeur libre) et l'enchaînement intensité→contexte→notes.
- **Parité web ≡ mobile** respectée : l'aperçu praticien est un miroir interactif fidèle
  (5 modes), commentaire de tête explicite « lecture seule, ne persiste pas ».
- CSS web entièrement tokenisé (`var(--color-*)`, `var(--radius-md)`, `var(--shadow-sm)`).

---

## Checklist finale
- [x] MDR — aucun seuil/alerte/interprétation, couleurs = identité de famille (documenté)
- [x] Accès données — `lib/database.ts` (exception légitime), zéro Supabase/SQLite dans un composant
- [x] TS strict — zéro `any`/`as unknown`/suppression (les `as McIcon` = narrow string→union d'icônes DB, pattern établi)
- [x] config-first — taxonomie 100 % en base, `field_props` atomiques
- [x] Sync — `syncUpsert`/`syncDelete` + mock test
- [x] i18n — zéro texte en dur **sauf** `aria-label="back"` (bloquant) ; parité fr/en + teen OK
- [x] Schéma — `database.ts` (fresh + migration), `seed.sql` miroir
- [x] Tests — services/composants couverts (TreeSelectorHeader indirectement)
- [x] Docs — spec + module-engine + modules + emotion_wheel.md (spec non indexée → attention)
- [ ] Design system — boutons natifs `ts-cancel`/`ts-new-btn` à migrer vers `ui/Button` (attention)
