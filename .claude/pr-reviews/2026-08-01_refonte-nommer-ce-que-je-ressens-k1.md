---
date: 2026-08-01
branch: refonte/nommer-ce-que-je-ressens-k1
pr_number: 272
pr_url: https://github.com/KaerOrg/Kaer/pull/272
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
warnings: 1
files_created: 2
files_modified: 12
rules_enriched: 0
---

# PR Review — refonte/nommer-ce-que-je-ressens-k1
Date : 2026-08-01
PR #272 — refonte(mobile): renommer emotion_wheel en « Nommer ce que je ressens » (K-1)

## CI GitHub Actions (commandes exactes du workflow)
| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 errors, 200 warnings pré-existants, aucun sur un fichier de la PR) |
| test-web | `cd apps/web && npx vitest run` | ✅ (1280 passed, 6 skipped, 6 todo) |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ |

## Synchronisation avec main
- Merge `origin/main` : **propre** (auto-merge, aucun conflit)
- Fichiers en conflit résolus : aucun

## Fichiers analysés (périmètre PR réel, `origin/main...origin/PR`)
- Créés : 2 (`emotionWheelNaming.guard.test.ts`, archive de review `.claude/pr-reviews/…`)
- Modifiés : 12 (8 locales i18n mobile + 4 docs + README)

> Nature : **refactor de renommage pur** (aucun composant, aucun schéma, aucune donnée
> patient). L'identifiant technique `emotion_wheel` est inchangé ; seuls libellé,
> description et footer affichés bougent.

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 |
| ⚠️ Points d'attention | 1 (cosmétique) |
| ✅ Conformes | tout le reste |

---

## 🚫 VETO MDR
Aucun. La PR **améliore** la conformité MDR : la description passe de
« Explorer et nommer ses émotions avec précision pour lutter contre l'alexithymie »
(cadrage clinique / pathologie nommée) à « Mettre un mot précis sur ce que vous
ressentez. » (formulation neutre, non interprétative). Le footer conserve la mention
« Outil de psychoéducation, non un instrument de mesure ». ✔️

---

## 🚫 Violations bloquantes
Aucune.

---

## ⚠️ Points d'attention

### `docs/README.md` — ligne 57 (cosmétique, non bloquant)
La puce du module passe de `— Roue des émotions (Plutchik)` à `: Nommer ce que je
ressens (taxonomie Willcox)` : la correction Plutchik → Willcox est **juste** (le
module s'appuie sur la Feeling Wheel de Willcox, pas sur Plutchik), et le remplacement
du tiret long par `:` **respecte la règle ponctuation**. Seul effet de bord : les
puces sœurs de la liste utilisent encore ` — ` comme séparateur → légère incohérence
visuelle locale. Non imputable à cette PR (l'auteur applique la règle) ; à harmoniser
un jour sur l'ensemble de la liste. Aucune action requise ici.

---

## ✅ Points positifs

- **Garde-fou dédié** (`emotionWheelNaming.guard.test.ts`) : verrouille les deux
  critères d'acceptation (zéro occurrence de l'ancien nom dans TOUTES les locales
  mobile + nouveau libellé/description servis fr/en/teen). Le commentaire justifie
  précisément le choix d'un test plutôt qu'une relecture (réintroduction facile par
  merge sur des locales de 2000+ lignes). Typage propre (`EmotionWheelBlock`), aucune
  suppression, `LEGACY_NAMES` couvre les 6 langues et **exclut explicitement**
  « Feeling Wheel (Willcox, 1982) » (nom d'instrument à conserver en source).
- **Parité i18n complète** : le renommage est appliqué aux 6 langues (fr, en, de, es,
  it, pt) sur `label` + `description` + `title` + `footer`, et sur les deux namespaces
  `modules.emotion_wheel` **et** `module.emotion_wheel` de `fr/common.json`.
- **Design teen unifié** : suppression de la surcharge teen `title`
  (« Ce que je ressens vraiment » / « What I'm really feeling ») au profit d'un
  fallback sur `common` → **un seul nom** pour le module (le nom est déjà à la
  première personne, une surcharge ne ferait que dupliquer). La seule surcharge teen
  ajoutée est la `description` en tutoiement (« ce que **tu** ressens »), registre
  professionnel respecté, aucune familiarité. Décision documentée dans le test.
- **Scope web assumé et tracé** : `docs/modules/emotion_wheel.md` documente que le nom
  praticien côté web suit dans le **ticket #261**. Le web garde donc volontairement
  l'ancien libellé pour l'instant — écart **intentionnel et suivi**, pas un oubli de
  parité.
- **Ponctuation** : aucun tiret long U+2014/U+2013 introduit dans les chaînes de
  locale modifiées (vérifié par grep sur le diff).
- **Documentation à jour** : README, invitation-flow, docs/modules.md, docs/README.md
  et docs/modules/emotion_wheel.md renommés de façon cohérente, avec note de
  migration datée et renvoi au ticket #249.

---

## Checklist finale
- [x] Rules of Hooks / effets / keys — N/A (aucun code React modifié)
- [x] Gestion d'erreur — N/A (aucun `catch` ajouté)
- [x] Zéro Supabase/SQLite dans un composant — N/A
- [x] TypeScript strict (guard test : zéro any/unknown/suppression)
- [x] Zéro allocation inline — N/A
- [x] Architecture ui/ vs features/ — N/A (pas de composant)
- [x] Un seul composant par fichier — N/A
- [x] i18n — zéro texte en dur ; parité fr/en + teen (fallback intentionnel sur label/title)
- [x] Sécurité / Schéma — N/A (aucun DDL)
- [x] Config-first — N/A (aucun tableau TS de contenu)
- [x] Sync-service — N/A (aucune écriture SQLite)
- [x] MDR — améliore la conformité (retrait du cadrage « alexithymie »)
- [x] Parité web ≡ mobile — écart web assumé et tracé (#261)
- [x] Tests — garde-fou de renommage ajouté et vert
- [x] Documentation — 5 fichiers .md mis à jour et indexés
