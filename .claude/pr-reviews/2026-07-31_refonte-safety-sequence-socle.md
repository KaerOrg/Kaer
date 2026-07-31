---
date: 2026-07-31
branch: refonte/safety-sequence-socle
pr_number: 332
pr_url: https://github.com/KaerOrg/Kaer/pull/332
ci_pass: true
merge_clean: true
violations:
  mdr: 0
  data_access: 0
  typescript: 0
  i18n: 0
  tests: 0
  docs: 0
  design_system: 1
  config_first: 0
  rls_schema: 0
  one_component_per_file: 0
  teen_mode: 0
  error_handling: 1
  mdr_comment_accuracy: 1
warnings: 3
files_created: 10
files_modified: 14
rules_enriched: 1
---
# PR Review — refonte/safety-sequence-socle

Date : 2026-07-31

## CI GitHub Actions (commandes exactes du workflow)

| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ 0 erreur (200 warnings préexistants, **aucun** sur les fichiers de la branche) |
| test-web | `cd apps/web && npx vitest run` | ✅ 1259 |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 1298 |
| test-shared *(job ajouté par cette PR)* | `cd packages/shared && npx vitest run` | ✅ 81 |

## Synchronisation avec main

- Merge `origin/main` : **propre** (`Already up to date` — `main` n'a pas bougé depuis la création de la branche).
- Fichiers en conflit résolus : aucun.

## Fichiers analysés

- Créés : 10
- Modifiés : 14

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 0 restantes (**3 trouvées et corrigées** avant l'ouverture de la PR) |
| ⚠️ Points d'attention | 3 |
| ✅ Conformes | 21 fichiers sans remarque |

---

## 🚫 VETO MDR

**Aucun.** Vérifications menées :

- Aucun seuil, aucune comparaison de score, aucun label interprétatif.
- Aucune notification conditionnée par une donnée.
- Aucune couleur de gravité : une seule couleur d'action sur tout le parcours.
- Le routage sur les étapes vides est **structurel par construction** : `buildDisplayableSteps` reçoit un `ReadonlySet<string>` des sections non vides, jamais les items. Le contenu est inaccessible depuis la logique de parcours — l'invariant est porté par la signature, pas par une convention.
- Zéro écriture de donnée patient, verrouillé par un test **statique** sur les imports du layout (le test runtime ne verrait pas un appel derrière une branche non parcourue).

---

## 🚫 Violations bloquantes trouvées puis corrigées

> Corrigées dans le commit `15bff81e` avant l'ouverture de la PR. Listées ici parce qu'elles alimentent `lessons.md`.

### `apps/mobile/.../SafetySequence/SafetySequenceLayout.tsx`

**[Gestion d'erreur #96] — erreur avalée**
Le `.catch` de `getPlanItems` ne faisait rien qu'un commentaire : ni feedback utilisateur, ni report. Un plan de sécurité illisible est pourtant une anomalie sérieuse.
→ Corrigé : `reportFailedOperation(...)`. **Aucun toast n'est affiché volontairement** — en crise, un écran qui se plaint est pire que rien. L'échec remonte en télémétrie technique (zéro donnée patient), il n'est plus avalé.

**[Design system] — tailles de police en dur**
`fontSize: 32`, `22`, `13`, `12` dans le `StyleSheet`, alors que le thème était importé pour les couleurs et les espacements.
→ Corrigé : `22` existait déjà (`fontSize.h2`), `13`/`12` en `sm`/`xs`. Pour `32`, **ajout du palier `display` à l'échelle partagée** plutôt que de figer la valeur — la règle veut qu'on ajoute le token, pas qu'on le contourne (cf. l'incident `CaseloadTable.css` qui figeait 25 teintes).

**[Exactitude d'un invariant MDR] — commentaire faux**
L'en-tête affirmait « ce layout n'écrit RIEN », ce qui est devenu inexact avec l'ajout de la télémétrie.
→ Corrigé : « n'écrit aucune **donnée patient** », avec la sortie technique #96 explicitement nommée et justifiée comme hors périmètre MDR. Un invariant réglementaire imprécis est pire qu'un invariant absent : il rassure à tort.

---

## ⚠️ Points d'attention

### `apps/mobile/.../SafetySequence/SafetySequenceLayout.tsx`

**Écrans volontairement minimaux.** L'accueil, les ressources et la clôture ne rendent qu'un titre. C'est le périmètre du socle : P-6, P-10 et P-11 les construisent. Le choix a été de livrer un parcours qui **tourne vraiment** plutôt qu'une coquille à placeholders que le ticket suivant supprimerait.

**Libellés d'écran provisoires.** `sequence_home_title`, `sequence_resources_title` et `sequence_closing_title` seront réécrits par P-6, P-10 et P-11. Ils reprennent les formulations des maquettes, pas des inventions.

### i18n

**`de`/`es`/`it`/`pt` non alimentés** — best-effort assumé par la règle, mais à signaler. Parité stricte respectée sur `fr`/`en` `common` **et** `teen` (mobile), `fr`/`en` (web).

---

## ✅ Points positifs

- **Logique pure extraite dans `packages/shared`** au lieu d'être dupliquée entre les deux apps, comme l'est `crisisLogic.ts`. Les deux plateformes numérotent les étapes avec la même fonction : la dérive web/mobile devient impossible, pas seulement improbable. C'est exactement le défaut qui avait mordu la chronobiologie (la même saisie apparaissait à deux jours différents).
- **Invariant MDR porté par le typage.** `ReadonlySet<string>` plutôt que `PlanItem[]` : lire le contenu pour router ne se corrige pas en review, ça ne compile pas.
- **Test statique sur les imports** en complément du test runtime — c'est ce qui tiendra quand quelqu'un voudra « juste compter les ouvertures ».
- **Trou de CI comblé** : `packages/shared` n'était couvert par aucun job. 81 tests existants ne tournaient nulle part.
- **Design system respecté** : `ui/Button` partout, aucun `Pressable` nu, aucun style inline, tokens de thème pour couleurs, espacements et tailles.
- **Zéro `any`, zéro `as unknown`, zéro suppression** ; `catch (err: unknown)` correct.
- **États exclusifs en union discriminée** (`SequenceState`) plutôt qu'en booléens couplés.

---

## 📚 Enrichissement des règles

Deux cas nouveaux, non couverts par `lessons.md` :

1. **Erreur avalée dans un contexte où le toast est contre-indiqué.** Les cas existants opposent « avaler » et « afficher ». Ici la bonne réponse est **reporter sans afficher** : la contre-indication clinique du message d'erreur ne dispense pas du report.
2. **Un token manquant dans une échelle numérique.** `lessons.md` documente le cas des couleurs (`CaseloadTable.css`) mais pas celui des tailles. Même règle, même correction : on ajoute le palier, on ne fige pas la valeur.

---

## Checklist finale

- [x] Zéro Supabase/SQLite dans les composants
- [x] Aucune feuille ne pilote son propre cycle de données
- [x] TypeScript strict
- [x] Zéro allocation inline dans le render
- [x] Architecture `ui/` vs `features/` respectée
- [x] Un seul composant par fichier
- [x] Primitives RN correctes, zéro scroll horizontal accidentel
- [x] Design system — zéro valeur hardcodée
- [x] i18n — zéro texte en dur, parité fr/en + teen
- [x] MDR 2017/745 — aucun seuil, alerte ni interprétation
- [x] Config-first — clés dérivées du `module_id`, aucun module en dur
- [x] Tests — chaque source créé a son test direct
- [x] Documentation créée **et indexée** dans `docs/README.md`
- [ ] `de`/`es`/`it`/`pt` — best-effort, non alimentés
