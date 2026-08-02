---
date: 2026-07-28
branch: feat/masquer-echelles-sans-droits
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
  ponctuation: 1
warnings: 3
files_created: 1
files_modified: 17
rules_enriched: 1
---

# PR Review : feat/masquer-echelles-sans-droits
Date : 2026-07-28 · Ticket : #247

## CI GitHub Actions (commandes exactes du workflow)

| Job | Commande | Statut |
|---|---|---|
| typecheck-web | `cd apps/web && npx tsc -b --noEmit` | ✅ |
| lint-web | `cd apps/web && npx eslint .` | ✅ (0 erreur, 200 warnings préexistants) |
| test-web | `cd apps/web && npx vitest run` | ✅ 1265 tests |
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 1287 tests |

## Synchronisation avec main
- Merge `origin/main` : propre (`Already up to date`)
- Fichiers en conflit résolus : aucun

## Fichiers analysés
- Créés : 1 (`apps/web/src/test/hiddenModules.guard.test.ts`)
- Modifiés : 17 (2 SQL, 7 sources/tests web, 4 sources/tests mobile, 4 docs)

## Résumé

| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 1 (détectée et corrigée pendant la review) |
| ⚠️ Points d'attention | 3 |
| ✅ Conformes | 17 fichiers sans remarque résiduelle |

---

## 🚫 VETO MDR
Aucun. Le masquage est une décision de **droits d'auteur**, jamais dérivée d'une donnée
patient. Aucun seuil, aucun label interprétatif, aucune alerte conditionnelle n'est
introduit. Le filtrage porte sur une métadonnée d'outil (`modules.is_hidden`).

---

## 🚫 Violations bloquantes

### Ponctuation : tiret long dans la prose rédigée par l'assistant

**14 occurrences** réparties sur 11 fichiers (commentaires, JSDoc, un `describe(...)`,
un commentaire SQL) : `// #247 — Un module is_hidden est retiré…`,
`describe('modules masqués — garde-fou (#247)')`, etc.

La règle de `coding-standards.md` § Ponctuation bannit U+2014/U+2013 dans « toute
rédaction de l'assistant », pas seulement dans le texte visible. Le motif a été recopié
du code voisin, qui en est truffé : c'est de la dette préexistante, pas une norme.

→ **Corrigé pendant la review** : deux-points quand la suite explique, point quand ce
sont deux idées indépendantes. Le contenu **préexistant** de `docs/modules.md` (noms
d'échelles, cellules vides `| — |`) n'a pas été touché.
→ Cas ajouté à `lessons.md` § Ponctuation avec la vérif ciblée sur les lignes ajoutées.

---

## ⚠️ Points d'attention

### `apps/web/src/services/moduleAssignmentService.ts:12`
`fetchPatientModules` déclenche un second appel réseau via `fetchHiddenModuleIds`, hors
factory React Query donc non dédupliqué par le cache. Atténué par deux facteurs : les
deux lectures partent en parallèle (`Promise.all`, aucun coût de latence), et
`fetchPatientModules` est elle-même derrière `patientQueries`, donc l'appel ne part
qu'en cas de cache miss. À revoir si d'autres appelants de `fetchHiddenModuleIds`
apparaissent : passer alors par une factory `catalogQueries.hiddenIds()` avec
`CONFIG_QUERY_OPTIONS`, comme `comingSoonIds`.

### `apps/web/src/test/hiddenModules.guard.test.ts:31`
La liste `MUST_BE_HIDDEN` duplique celle du seed. C'est **volontaire et nécessaire** :
un garde-fou qui lirait sa vérité depuis la source qu'il surveille ne garde rien. Motif
identique à `fieldPropsAtomic.guard.test.ts` (`FORBIDDEN_PACKED_KEYS`). La double
édition requise à la réactivation est documentée dans `docs/database.md`.

### Docs de module des échelles masquées
`docs/modules/{asrs18,epds,nsi,snap_iv}.md` restaient muettes sur le masquage : un
lecteur arrivant directement dessus aurait cru le module actif.
→ **Corrigé pendant la review** : bandeau en tête de chaque fiche, avec le motif
juridique et le rappel que rien n'est supprimé. `rcads` et `bsl23` n'ont pas de fiche
dédiée, ils sont couverts par `docs/modules.md`.

---

## ✅ Points positifs

- **Filtre posé côté requête, jamais dans un composant.** Les trois lectures partant de
  `modules` portent `.eq('is_hidden', false)` : aucun appelant ne peut l'oublier. Zéro
  composant modifié, tout passe par la couche service et les factories existantes.
- **Seed bidirectionnel.** `set is_hidden = (id in (...))` aligne la base exactement sur
  le seed à chaque rejeu, dans les deux sens : retirer un id du seed le réactive. C'est
  la forme la plus forte de la règle config-first « base == seed », plus robuste qu'un
  `ON CONFLICT DO UPDATE` qui ne couvrirait que le sens du masquage.
- **Migration idempotente** sur le modèle de celle d'`icon`/`mobile_icon`/`color`, plus
  un `comment on column` qui documente les trois drapeaux à la source.
- **Fermeture de l'accès par URL directe.** `fetchModulePreviewKind` retourne
  `coming_soon` pour un module masqué : l'aperçu praticien rend les items, c'était le
  chemin oublié le plus probable.
- **Aucune donnée détruite.** Ni `delete`, ni `revoked_at` : les lignes
  `patient_modules` et les saisies patient restent intactes et réapparaissent à la
  réactivation.
- **Couverture complète** : chaque export touché a son test (filtres de catalogue,
  `fetchHiddenModuleIds` happy path + data null, aperçu masqué, fiche patient, liste
  mobile, routines), plus un garde-fou anti-régression.

---

## Checklist finale

- [x] MDR 2017/745 : aucun seuil, alerte ou interprétation
- [x] Zéro Supabase/SQLite dans un composant (aucun composant modifié)
- [x] TypeScript strict : zéro `any`, `as any`, `as unknown`, zéro suppression
- [x] Zéro allocation inline dans le render (aucun render touché)
- [x] Design system : hors périmètre, aucune UI introduite
- [x] i18n : aucun texte visible introduit
- [x] Schéma : `supabase/schema.sql` est la source de vérité, colonne + migration idempotente
- [x] RLS : aucune nouvelle table
- [x] Seed idempotent et rejouable, aucun texte en dur
- [x] Config-first : la liste des modules masqués vit en base, pas dans un tableau TS
- [x] Sync mobile : hors périmètre (`homeService` est en lecture seule)
- [x] Tests : chaque export touché couvert, happy path + cas limites
- [x] Documentation : `database.md`, `modules.md`, `services.md`, 4 fiches de module
- [x] Ponctuation : corrigée, cas versé à `lessons.md`

📚 Documentation enrichie :
- `lessons.md` § "Ponctuation : pas de tiret long" : +1 cas (prose de commentaires et
  noms de tests, avec la vérif ciblée sur les lignes ajoutées)
