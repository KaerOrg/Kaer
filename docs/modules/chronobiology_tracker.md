# Module `chronobiology_tracker` — « Rythmes & régularité »

> **Statut : `coming_soon`** (refonte en cours, branche `refonte/chronobiologie`).
> Spec et feuille de route : [`docs/spec/rythmes-regularite.md`](../spec/rythmes-regularite.md).
> `module_id` inchangé (`chronobiology_tracker`) ; seul le **nom affiché** devient « Rythmes & régularité ».

## Objet

Carnet de suivi des **rythmes sociaux quotidiens** (zeitgebers comportementaux). Objet clinique :
la **régularité des horaires de vie**. Complémentaire de l'agenda du sommeil (`sleep_diary`), qui
reste l'outil fin du sommeil ; ici on suit la régularité des ancres de la journée.

Base scientifique et décisions de cadrage : voir la spec.

## Structure (preview_kind `tabbed`)

Deux onglets (l'ancien onglet **Fiches**/psyedu a été **retiré** — refonte 2026-06-15) :

| Onglet | `sub_preview_kind` | Contenu |
|---|---|---|
| Journal | `column_form` | Saisie des ancres horaires du jour (toutes optionnelles) |
| Mois | `chrono_month` | Vue mensuelle / historique neutre |

## Catalogue d'ancres

Défini en base (`module_content_fields`, champs `column_time_field` enfants de `chrono.col.h`) :

| Clé | Ancre | i18n (contenu) |
|---|---|---|
| `wake_time` | Lever | `modules.chrono_bio.wake_time` |
| `first_meal` | Premier repas | `modules.chrono_bio.first_meal` |
| `main_activity` | Activité principale | `modules.chrono_bio.main_activity` |
| `last_meal` | Dernier repas | `modules.chrono_bio.last_meal` |
| `bedtime` | Coucher | `modules.chrono_bio.bedtime` |
| `light` | Exposition à la lumière / sortie | `modules.chrono_bio.light` |

Les 5 premières = Social Rhythm Metric-5 de l'IPSRT. `light` ajoutée à la refonte (zeitgeber
dominant, Dollish 2023). Toutes **optionnelles** (`field_props optional = '1'`).

## Configuration par patient (à implémenter — Phase 2 web)

Le praticien choisira, **par patient**, le sous-ensemble d'ancres suivi (pertinence clinique +
friction réduite). Modèle de stockage prévu, aligné sur `medication_side_effects`
(`tracked_effects`) :

```
patient_modules.config = { "anchors": ["wake_time", "first_meal", "light", "bedtime"] }
```

Le catalogue (ancres disponibles) vit en base (ci-dessus) ; la **sélection** vit dans
`patient_modules.config.anchors`. Le `column_form` filtrera les ancres affichées selon cette
sélection (défaut : toutes si non configuré).

## Conformité MDR 2017/745

> Le code affiche, jamais il ne conclut.

- **Vue patient** : horaires saisis en historique neutre + visualisation de dispersion non jugée ;
  rappel d'horaire **fixe** (non conditionnel aux données) ; saisie **anti-friction** (bouton
  « comme d'habitude », < 10 s, rétroactif). Streak de **saisie** (engagement) autorisé.
- **Vue praticien** : indice de régularité **calculé** (chiffre brut, comme un score d'échelle).
- **Interdits** : score/label affiché au patient, alerte déclenchée par les données, comparaison à
  une norme, flèche/couleur de tendance, **streak de régularité**.

## Données

- Saisie patient → SQLite local `chrono_entries` (offline-first) + `syncUpsert`/`syncDelete`
  (`entry_kind` à ajouter à l'union `EntryKind` de `syncOutbox.ts` **avant** d'écrire le service —
  Phase 3).
- Indice de régularité = **calcul** côté service/web (algorithme, pas donnée), méthode à arrêter en
  Phase 4.

## Contenu psychoéducatif

`supabase/seed/chrono_seed.sql` contient 7 fiches psyedu sourcées (dont une sur l'ancre lumière).
Elles ne sont **plus** branchées dans le tracker (onglet Fiches retiré) ; elles seront surfacées
via le module **Psychoéducation** dédié et/ou un lien depuis le module (Phase 5). Le seed est
conservé — contenu sourcé à ne pas perdre.

## Dette i18n à combler AVANT release (bloquant Phase 2/3)

Le module étant resté `coming_soon`, son contenu n'est traduit qu'en **mobile fr**. À compléter :

- [ ] Namespace **contenu** `modules.chrono_bio.*` absent en **mobile en**, **web fr**, **web en**
  → à créer (parité, cf. règle i18n CLAUDE.md). Inclure la clé `light`.
- [ ] Variantes **teen** (`modules.chrono_bio.*` + `modules.chronobiology_tracker.*`) absentes
  (mobile fr/en) → à créer.
- [ ] Clés d'ancres `modules.chronobiology_tracker.anchor_*` absentes en mobile en.

Fait en Phase 1 : renommage « Rythmes & régularité » (mobile fr/en, web fr/en), ajout de l'ancre
`light` (seed + mobile fr), retrait du tab Fiches.
