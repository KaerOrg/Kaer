---
name: ticket-resolve
description: Résout un ticket GitHub Kær de bout en bout — lit et analyse l'issue, vérifie qu'elle n'est pas déjà faite, crée une branche, implémente dans le respect des `.claude/rules/`, garantit tests + commentaires + doc, lance une review de conformité (`pr-review`) puis une passe `simplify`, ouvre la PR (`Closes #N`) et clôt le ticket. Triggers — "résous le ticket #N", "traite l'issue #N", "traite le ticket #N", "resolve issue #N", "ticket-resolve", "prends le ticket #N".
---

# Ticket Resolve — Kær

Tu es un **ingénieur senior** qui prend un ticket GitHub et le mène jusqu'à une PR
ouverte et un ticket clos, sans jamais relâcher la qualité Kær. Ce skill **orchestre**
la chaîne : il ne réimplémente pas les autres skills, il les invoque au bon moment
(`feature-architect` / `module-builder` pour concevoir et coder, `pr-review` pour la
conformité, `simplify` pour le nettoyage). Ta valeur ajoutée est l'enchaînement strict,
les **portes de validation** entre chaque étape, et le fait de ne jamais sauter une
vérification parce que « ça a l'air d'aller ».

> **Argument du skill** : le numéro du ticket (`#40`, `40`, ou une URL d'issue). Si
> aucun numéro n'est fourni, demander lequel traiter — ne jamais deviner.

---

## ⭐ Trois principes qui priment sur la checklist

1. **Ne jamais réimplémenter ce qui existe déjà.** Avant d'écrire la moindre ligne,
   vérifier si le besoin du ticket est déjà couvert par le code en place (Étape 2).
   Un ticket peut décrire un travail déjà fait, partiellement fait, ou fait autrement
   et mieux. Cas vécu : l'issue #40 décrivait un `fetchModuleSummary` + un panneau de
   résumé qui **existaient déjà**, câblés et testés — la bonne action était de le
   constater et de clore, pas de coder.

2. **Conformité aux règles = condition de sortie, pas une option.** Le code produit
   passe par `pr-review` (toutes les `.claude/rules/`) et **toutes les violations
   bloquantes sont corrigées** avant la PR. Une chaîne qui s'arrête sur du rouge n'est
   pas terminée.

3. **Feature = doc + tests + commentaires.** Aucun ticket n'est « résolu » sans tests
   (happy path + erreurs + edge cases), sans commentaires sur la logique non évidente,
   et sans doc à jour (design-system, `docs/`, doc de feature). C'est la définition de
   terminé du projet, pas un bonus.

---

## Étape 0 — Lire et comprendre le ticket

1. Récupérer le ticket en entier :

   ```bash
   gh issue view <N> --repo KaerOrg/Kaer --comments
   ```

2. Lire **tout** : description, critères d'acceptation, périmètre technique, fichiers
   clés cités, commentaires, labels, et les tickets/PR liés s'il y en a.

3. **Voir les maquettes du ticket — jamais se contenter de leur URL.** `gh issue view`
   ne renvoie que du markdown : une image apparaît sous la forme `![alt](url)`, dont
   tu ne vois **que le lien, pas les pixels**. Sur un ticket de refonte UI, la maquette
   **EST la spec** — implémenter à partir du seul texte, c'est passer à côté de la
   référence visuelle. Donc, pour **chaque** image référencée dans le corps ou les
   commentaires (`![…](…)`, `<img src="…">`, lien finissant par `.png`/`.jpg`/`.jpeg`
   /`.webp`) :

   - **Image versionnée dans le repo** (`docs/spec/assets/…`, chemin relatif ou blob
     GitHub) → la lire directement depuis le disque (outil `Read` sur le fichier local
     après `git fetch`), c'est le plus fiable.
   - **Pièce jointe GitHub / URL de contenu privé** → la télécharger puis l'ouvrir :

     ```bash
     # blob épinglé au repo : passer par l'API contents (gère l'auth du repo privé)
     gh api "repos/KaerOrg/Kaer/contents/<chemin>?ref=<sha-ou-branche>" \
       --jq '.content' | base64 -d > /tmp/maquette.png
     # pièce jointe user-attachment (githubusercontent) :
     # gh api "<url>" > /tmp/maquette.png   (ou curl -L avec le token gh)
     ```

     puis **`Read` sur `/tmp/maquette.png`** pour réellement voir l'écran.

   - Décrire la maquette dans la conversation (structure, composants, tokens visibles)
     et la garder comme **grille de référence visuelle** pendant l'implémentation :
     l'écran livré doit être fidèle à la maquette, pas seulement au texte.

   Si une image référencée est inaccessible (404, lien mort, attachement supprimé) :
   le signaler à l'utilisateur et demander la maquette avant de coder une refonte UI.

4. Extraire et reformuler dans la conversation, en quelques lignes :
   - **Objectif métier** (ce que veut l'utilisateur final, praticien ou patient).
   - **Critères d'acceptation** sous forme de liste cochable — ils deviennent la grille
     de vérification finale.
   - **Périmètre** : fichiers à toucher, fichiers explicitement à NE PAS toucher.
   - **Contraintes Kær** déclenchées : MDR (affichage neutre), parité web ≡ mobile,
     offline-first/`syncHelpers`, config-first, i18n + mode ado, RLS si nouvelle table.

> Si le ticket est ambigu, contradictoire, ou laisse un choix d'architecture ouvert
> qui change ce qu'on code : **poser la question à l'utilisateur** (`AskUserQuestion`)
> avant d'aller plus loin. Ne jamais deviner une intention métier.

---

## Étape 1 — Analyser l'état du code (sur `main` à jour)

> But : se faire une image fidèle du code **actuel** avant de juger ce qu'il reste à
> faire. Cette étape se fait sur `main` resynchronisé, pas encore sur une branche.

```bash
git fetch origin --quiet && git checkout main --quiet && git pull origin main --quiet
```

Puis explorer le périmètre cité par le ticket : ouvrir les fichiers clés, repérer les
services/composants/écrans concernés, comprendre les patterns voisins déjà en place
(le code à écrire doit se lire comme le code voisin **conforme**). Pour une exploration
large, déléguer à l'agent `Explore`.

---

## Étape 2 — PORTE « déjà fait ? » (obligatoire avant tout code)

> **Aucune ligne de code n'est écrite avant d'avoir franchi cette porte.** C'est la
> leçon de l'issue #40.

Confronter **chaque critère d'acceptation** au code lu à l'Étape 1 :

- Le service / composant / écran demandé existe-t-il déjà ? (`grep` les noms de
  fonctions, types, composants cités par le ticket).
- S'il existe, est-il **câblé** (réellement atteint depuis l'UI) et **testé** ?
- Le comportement réel satisfait-il les critères d'acceptation ?

Trois issues possibles :

| Constat | Action |
|---|---|
| **Déjà fait** (tous les critères satisfaits, câblé, testé) | Vérifier en lançant les tests concernés, **ne pas créer de branche**, aller directement à l'Étape 9 variante « clôture sans PR » : commenter le ticket avec les preuves (fichiers:lignes + tests verts) et le clore. |
| **Partiellement fait** | Lister précisément ce qui manque ; le périmètre réel de l'implémentation se limite à ce delta. Continuer à l'Étape 3. |
| **À faire** | Continuer à l'Étape 3. |

> Reporter fidèlement le constat à l'utilisateur avant de poursuivre. Si « déjà fait »,
> ne jamais inventer du travail pour justifier une PR.

---

## Étape 3 — Créer la branche

Nom de branche selon la nature du ticket, depuis `main` à jour :

```bash
git checkout -b <type>/<slug-court>
# type : feat | fix | refactor | docs | chore — slug dérivé du titre du ticket
```

Exemple : ticket « feat: afficher les vraies données patient » → `feat/module-summary-real-data`.

---

## Étape 4 — Concevoir et implémenter

> **Ne pas coder en vrac.** Passer par le skill de conception adapté, qui applique
> déjà l'analyse d'architecture, la réutilisation du design system, le typage strict
> et le test-first.

| Nature du ticket | Skill à invoquer |
|---|---|
| Nouveau module thérapeutique | `module-builder` (lecture préalable `docs/module-engine.md`) |
| Toute autre feature / fix / refactor | `feature-architect` |

Pendant l'implémentation, respecter sans exception (les détails vivent dans les
règles — les ouvrir, ne pas les paraphraser de mémoire) :

- **Design system d'abord** : ouvrir `src/components/ui/` AVANT le premier JSX ;
  étendre un primitive plutôt que dupliquer. (`coding-standards.md`)
- **Zéro SQL dans un composant** : tout passe par un `*Service.ts`. (`coding-standards.md`)
- **Sync mobile** : toute écriture SQLite patient via `syncUpsert`/`syncDelete`. (`sync-service.md`)
- **Config-first** : donnée métier en base, `field_props.prop_value` atomique. (`config-first.md`)
- **MDR 2017/745** : le code affiche, ne conclut jamais — aucun seuil, label
  interprétatif, ni couleur de jugement. (`CLAUDE.md` RÈGLE D'OR)
- **i18n** : zéro texte en dur, clés `fr`+`en` (+ best-effort `de/es/it/pt`), et
  **variante teen** (`teen.json` fr+en) pour toute clé `modules.<id>.*`. (`coding-standards.md`)
- **Parité web ≡ mobile** + **ordre web-puis-mobile** pour un nouveau module. (`CLAUDE.md`)
- **Ponctuation** : aucun tiret long `—`/`–` dans le texte visible ni la prose.
- **Zéro suppression** : pas de `@ts-ignore`, `eslint-disable`, `as any`, `as unknown as X`.

---

## Étape 5 — Tests, commentaires, documentation

> **Definition of done du projet.** Cette étape n'est pas optionnelle : un fichier
> source créé OU un export ajouté = son test dans le même commit.

1. **Tests** — pour chaque fichier source créé et chaque export ajouté :
   - Service / hook / helper pur : test direct (happy path + cas d'erreur + edge cases).
   - Composant à logique : test de rendu/interaction (ne pas se contenter d'un test
     d'intégration qui le mocke — un mock du composant prouve qu'il n'est pas couvert).
   - Mocks synchronisés avec les exports (un renommage casse les `vi.mock`/`jest.mock`).

2. **Commentaires inline ciblés** — uniquement la logique non évidente : invariants,
   workarounds, race conditions, raison d'un calcul MDR. Pas de bruit sur du code qui
   se lit seul.

3. **Documentation** — mettre à jour, **dans le même commit que le code** :
   - Nouveau composant `ui`/widget → `apps/<app>/docs/design-system.md` (table props + exemple).
   - Nouveau `field_type` / layout (`preview_kind`) → `docs/module-engine.md`.
   - Nouveau service → `docs/services.md`.
   - Nouvelle table / RLS → `supabase/schema.sql` (source de vérité) + `docs/database.md`.
   - Doc de feature dédiée si le ticket introduit un flux transverse (`docs/spec/`).
   - Vérifier l'indexation : un doc créé est référencé depuis `docs/README.md`.

---

## Étape 6 — Review de conformité (skill `pr-review`)

Invoquer le skill **`pr-review`** sur la branche courante. Il lit chaque fichier
modifié/ajouté en entier et applique l'intégralité des `.claude/rules/` + règles
`CLAUDE.md` (MDR, design system, couches, i18n, tests, doc, config-first, sync).

> **Porte de sortie :** toute **violation bloquante** remontée par `pr-review` est
> **corrigée**, puis on relance la review sur les fichiers retouchés jusqu'à ce qu'il
> ne reste que des points d'attention non bloquants (ou rien). On ne passe pas à
> l'étape suivante avec une violation bloquante ouverte.

Note : `pr-review` lance lui-même une passe `simplify` en étape ultime. Si tu as
exécuté `pr-review` jusqu'au bout, l'Étape 7 ci-dessous est déjà couverte — ne pas la
relancer en double ; sinon, l'exécuter explicitement.

---

## Étape 7 — Passe de simplification (skill `simplify`)

Si elle n'a pas déjà été faite par `pr-review`, invoquer **`simplify`** (`/simplify`)
sur tout le périmètre de la branche (`main...HEAD`). Passe **qualité uniquement**
(réutilisation, simplification, efficacité, altitude) — elle applique directement les
corrections. Si rien à nettoyer, le signaler (« scope déjà simple »).

---

## Étape 8 — PORTE « mergeable » : resynchroniser `main` et résoudre les conflits

> **`main` a pu avancer pendant l'implémentation.** Une PR qui ne se merge pas
> proprement bloque la chaîne (conflits GitHub, CI rouge sur l'état mergé). On vérifie
> et on résout les conflits **localement, avant** de lancer la CI et d'ouvrir la PR —
> jamais en laissant GitHub révéler le problème après coup.

1. Resynchroniser `main` distant et le merger dans la branche (procédure
   [`.claude/rules/merge-procedure.md`](../../.claude/rules/merge-procedure.md)) :

   ```bash
   git fetch origin
   git merge origin/main
   ```

2. **Analyser le résultat** :
   - Merge propre (fast-forward / auto-merge sans conflit) → continuer à l'Étape 8bis.
   - Conflits (`CONFLICT` dans la sortie, code d'erreur) → les lister et les résoudre :

     ```bash
     git diff --name-only --diff-filter=U
     ```

     Pour chaque fichier en conflit : le **lire en entier**, trancher en respectant
     **toutes** les règles du projet (la résolution ne doit jamais introduire une
     violation), conflits additifs → garder les deux côtés. En cas de doute sur
     l'intention métier d'un côté, **demander à l'utilisateur**.

3. **Inspecter aussi les fichiers auto-mergés sensibles** (`database.types.ts`,
   `schema.sql`, `seed.sql`, locales i18n) : un auto-merge « réussi » peut produire du
   code incohérent ou des clés i18n dupliquées.

4. Vérifier qu'il ne reste **aucun** marqueur, puis conclure le merge :

   ```bash
   grep -rn "^<<<<<<<\|^=======\|^>>>>>>>" <fichiers concernés>   # doit être vide
   git add <fichiers résolus> && git commit --no-edit
   ```

   Terminer le message par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

> Reporter dans le rapport final si le merge était propre ou a nécessité une résolution,
> et lister les fichiers concernés (ils entrent dans le périmètre re-vérifié à l'Étape 8bis).

---

## Étape 8bis — PORTE verte : CI locale (les deux apps)

> Reproduire **mot pour mot** les jobs de `.github/workflows/ci.yml`, **sur l'état
> fraîchement mergé** (Étape 8). Une divergence de commande masque des erreurs. Les
> cinq doivent être verts avant la PR.

```bash
cd apps/web    && npx tsc -b --noEmit      # typecheck-web
cd apps/web    && npx eslint .             # lint-web
cd apps/web    && npx vitest run           # test-web
cd apps/mobile && npx tsc --noEmit         # typecheck-mobile
cd apps/mobile && npx jest --passWithNoTests   # test-mobile
```

Si une suite échoue : **corriger à la source** (jamais de suppression de type), relancer.
Ne jamais ouvrir la PR sur du rouge. Rapporter fidèlement toute sortie d'échec.

---

## Étape 9 — Commit, push, Pull Request

> L'utilisateur a invoqué ce skill en demandant explicitement d'ouvrir une PR : c'est
> l'autorisation de pousser la branche et d'ouvrir la PR. En revanche, **ne jamais
> merger** la PR sans validation explicite.

1. **Commit** (sur la branche, jamais sur `main`) avec un message clair en français,
   terminé par la signature :

   ```
   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```

2. **Push** la branche :

   ```bash
   git push -u origin <branche>
   ```

3. **Ouvrir la PR** vers `main`. Le corps **doit** contenir `Closes #<N>` (lie et
   ferme automatiquement le ticket au merge), un résumé du changement, la liste des
   critères d'acceptation cochés, et se terminer par :

   ```
   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

   ```bash
   gh pr create --repo KaerOrg/Kaer --base main \
     --title "<type>: <résumé>" \
     --body "$(cat <<'EOF'
   ## Contexte
   Closes #<N>

   ## Changements
   - …

   ## Critères d'acceptation
   - [x] …

   ## Tests
   - CI verte (tsc + eslint + vitest web, tsc + jest mobile)

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

---

## Étape 10 — Clôturer le ticket

Comme demandé, clore le ticket en fin de chaîne avec un commentaire qui **prouve** la
résolution (fichiers:lignes, tests verts, PR liée) :

```bash
gh issue close <N> --repo KaerOrg/Kaer --comment "Résolu par #<num PR>.

<résumé : ce qui a été fait, fichiers clés, tests verts, conformité MDR/règles>"
```

> **Cas « déjà fait » (Étape 2)** : pas de PR — clore directement avec un commentaire
> qui pointe l'implémentation existante (fichiers:lignes), confirme les tests verts et
> détaille en quoi chaque critère d'acceptation est satisfait.

---

## Rapport final (dans la conversation)

Terminer par un récapitulatif concis :

- **Constat Étape 2** : à faire / partiel / déjà fait.
- **Branche + PR** : noms et URL (ou « clôture sans PR » si déjà fait).
- **Fichiers créés / modifiés**, avec leurs tests.
- **Doc mise à jour**.
- **Violations `pr-review` corrigées** + retouches `simplify`.
- **Merge `main`** : propre ou conflits résolus (lister les fichiers concernés).
- **CI** : les 5 jobs verts (sur l'état mergé).
- **Ticket** : clos, avec le lien.
- **Reste à faire** éventuel (ex. merge en attente de validation, suivi mobile d'un
  module dont seul le web est livré).

---

## Garde-fous transverses

- **Ne jamais merger** la PR ni pousser sur `main` sans validation explicite.
- **Ne jamais clore un ticket** sur du rouge (tests/tsc/eslint en échec) ou avec une
  violation bloquante ouverte.
- **Hors périmètre** : si on repère une dette voisine non liée au ticket, la signaler
  dans le rapport — ne pas l'embarquer dans la PR (scope creep).
- **Reporting fidèle** : si une étape est sautée ou échoue, le dire ; ne jamais
  maquiller un échec en succès.
