---
date: 2026-08-02
branch: refonte/nommer-sans-mot-k7
pr_number: 278
pr_url: https://github.com/KaerOrg/Kaer/pull/278
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
warnings: 0
files_created: 2
files_modified: 16
rules_enriched: 0
---

# PR Review — refonte/nommer-sans-mot-k7 (#278)
Date : 2026-08-02

> PR **empilée** : base = `refonte/nommer-fiche-unique-k6` (K-6), pas `main`. La review porte sur le diff `refonte/nommer-fiche-unique-k6...HEAD`. Pas de merge `main` (le ferait entrerait toute la chaîne empilée) — sync jugée non pertinente pour une PR stackée.

## CI GitHub Actions
| Job | Commande | Statut |
|---|---|---|
| typecheck-mobile | `cd apps/mobile && npx tsc --noEmit` | ✅ |
| test-mobile | `cd apps/mobile && npx jest --passWithNoTests` | ✅ 189 suites / 1322 tests |

> Web non exécuté : la PR ne touche aucun fichier `apps/web/` (100 % mobile + seed/docs).

## Fichiers analysés
- Créés : 2 (`migration_emotion_wheel_sans_mot_k7.sql`, rapport de review archivé)
- Modifiés : 16

## Résumé
| Sévérité | Nombre |
|---|---|
| 🚫 Violations bloquantes | 1 |
| ⚠️ Points d'attention | 0 |
| ✅ Conformes | 17 fichiers sans remarque |

---

## 🚫 VETO MDR
Aucun. L'intensité reste un chiffre brut (aucun défaut, aucune couleur de seuil). L'entrée « sans mot » utilise un **filet gris neutre** (`colors.border`) et non la teinte d'une famille — aucun encodage de gravité. Le titre « On garde le moment, sans le nommer. » ne présente jamais l'absence de mot comme un échec (critère du ticket, testé). ✅

---

## 🚫 Violations bloquantes

### `apps/mobile/src/i18n/locales/en/teen.json` + `fr/teen.json` — [i18n / parité teen]

**Parité teen partielle sur les 3 clés `modules.emotion_wheel.wordless_*` ajoutées.**

La PR ajoute dans `common.json` (fr + en) trois clés **applicatives et live** :
`wordless_title`, `wordless_hint`, `wordless_label`. Or le portage teen est incomplet :

| Clé | `fr/common` | `en/common` | `fr/teen` | `en/teen` |
|---|---|---|---|---|
| `wordless_title` | ✅ | ✅ | ❌ manquant | ❌ manquant |
| `wordless_hint`  | ✅ | ✅ | ✅ ajouté | ❌ manquant |
| `wordless_label` | ✅ | ✅ | ❌ manquant | ❌ manquant |

`en/teen.json` n'a **pas été touché du tout** ; `fr/teen.json` n'a reçu que `wordless_hint`.

Ce n'est **pas** un fallback assumé : le bloc teen d'`emotion_wheel` est **exhaustif** (il double déjà `entry_title`, `node`, `save_btn`, `stop_hint`, `validate_here_keep`…), et `emotion_wheel` est un module **applicatif**, pas une échelle psychométrique validée — donc l'exception de fidélité aux échelles ne s'applique pas. Le fallback i18next masque le trou au runtime, d'où l'invisibilité en test, mais la règle (« l'absence dans teen est un bug bloquant pour toute clé de module ») s'applique. C'est **exactement** le cas vécu `refonte/nommer-familles-k4 (2026-08-02)` déjà consigné dans `lessons.md`.

→ Ajouter dans **`fr/teen.json`** : `wordless_title`, `wordless_label`.
→ Ajouter dans **`en/teen.json`** : `wordless_title`, `wordless_hint`, `wordless_label`.
Registre teen (tutoiement) : `wordless_hint` fr est déjà correctement converti (« Tu pourras le nommer plus tard »). `wordless_title` (« On garde le moment, sans le nommer. ») et `wordless_label` (« Sans mot ») n'ont pas de vouvoiement à convertir — contenu identique acceptable, mais la clé **doit être présente** pour la parité d'ensemble.

Vérif attendue vide après correction :
```bash
python3 - <<'PY'
import json
def flat(d,p=''):
    for k,v in d.items():
        nk=f"{p}.{k}" if p else k
        if isinstance(v,dict): yield from flat(v,nk)
        else: yield nk
for lang in ('fr','en'):
    c=set(flat(json.load(open(f'apps/mobile/src/i18n/locales/{lang}/common.json'))['modules']['emotion_wheel']))
    t=set(flat(json.load(open(f'apps/mobile/src/i18n/locales/{lang}/teen.json'))['modules'].get('emotion_wheel',{})))
    print(lang, c-t)
PY
```

---

## ⚠️ Points d'attention
Aucun.

---

## ✅ Points positifs

- **Extension propre du primitive, pas de duplication.** L'API du primitive passe de `onSkip?: () => void` (callback géré par le parent) à `allowWordless?: boolean`, la machine d'état `handleSkip` remontant dans `useTreeSelectorFlow`. La logique de sortie « sans mot » vit désormais au bon endroit (le flux), et le parent ne fait que déclarer une capacité. Doc `design-system.md` mise à jour dans le **même commit** (ligne du tableau des props remplacée). Comportement attendu, salué.
- **Séparation des concepts respectée.** Le primitive `ui/TreeSelector` reste 100 % présentationnel : `wordlessTitle`/`wordlessHint` arrivent par props déjà traduites, `WORDLESS_SELECTED_ID` et la logique « chemin vide » vivent dans le **layer** (`helpers.ts` / `TreeSelectorLayout.tsx`), pas dans le primitive. `wordless_label` est résolu par le layer (`toEntryVM`) et n'entre pas dans `TreeSelectorTexts` — découpage juste.
- **Double garde du chemin vide, cohérente.** Refus d'un chemin vide et dans le flux (`submit`: `if (finalPath.length === 0 && !wordless) return`) et dans le layer (`handleSubmit`: `if (path.length === 0 && !config.enableWordless) return`). Le testé « un chemin vide reste refusé hors sortie sans mot » verrouille l'invariant.
- **Config-first respecté.** `enable_wordless` + les 3 libellés sont en base (`field_props`), pas en TS statique. Migration idempotente `ON CONFLICT … DO UPDATE`, miroir fidèle du bloc seed. Seed lui-même en `DO UPDATE`.
- **MDR / conformité éditoriale.** Filet gris neutre, aucun message d'échec (testé), documenté noir sur blanc (limite `NOT NULL` assumée dans la PR + `docs/modules/emotion_wheel.md`).
- **Couverture de tests réelle.** 4 nouveaux cas primitif (ouverture fiche sans sélection, mêmes champs, absence de message d'échec, refus chemin vide) + 1 cas layer (`toEntryVM` « Sans mot » → filet gris) + 1 cas contexte libre. Le composant testé n'est pas mocké.
- **Zéro tiret long** dans les lignes ajoutées (prose, commentaires, tests, SQL). Vérifié.

---

## Checklist finale

### coding-standards.md
- [x] Zéro Supabase/SQLite dans les composants — layer passe par `useTreeSelectorData` (service)
- [x] Feuilles présentationnelles — le primitive reçoit tout par props, le layer possède le cycle de données
- [x] TypeScript strict (zéro any/as unknown/suppression) — tsc vert
- [x] Zéro allocation inline notable (`SELECTED_STATE` hoisté, callbacks mémoïsés)
- [x] Architecture ui/ vs features/ respectée — aucune fuite métier dans `ui/TreeSelector`
- [x] Un seul composant par fichier
- [x] Design system — `wordless` header = `View`+`Text`, pas un bouton ; aucun nouveau bouton ad hoc introduit
- [ ] **i18n — parité teen incomplète (violation bloquante ci-dessus)**
- [x] Schéma — migration = config `field_props` uniquement, aucune nouvelle table/colonne (schema.sql non requis)

### config-first.md
- [x] Zéro tableau TS décrivant le contenu du module — tout en `field_props`
- [x] Seed / migration idempotents `ON CONFLICT DO UPDATE`

### CLAUDE.md
- [x] MDR 2017/745 — aucun seuil, filet gris neutre, aucun message d'échec
- [x] Composant existant **étendu** (allowWordless) plutôt que dupliqué
- [x] Parité graphique web ≡ mobile — N/A (aucun graphique ajouté ; module non concerné par PatientEvolutionTab ici)

### Obligatoires (Étape 5)
- [x] Tests — chaque comportement ajouté couvert (primitif + layer)
- [x] Documentation — `design-system.md` (prop), `docs/modules/emotion_wheel.md` (section K-7) mis à jour
- [ ] **Zéro texte en dur — clés i18n présentes mais parité teen à compléter**
