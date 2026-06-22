# Refonte — Agenda du sommeil (`sleep_diary`)

> Branche : `refonte/agenda-sommeil` (basée sur `main` post-TanStack Query).
> Statut : en cours. Objectif : version complète, conforme au standard clinique
> (Consensus Sleep Diary), visuellement aboutie, utile au praticien comme au patient.

## 1. Pourquoi cette refonte

Diagnostic de l'existant :

- **Modèle de données incomplet** vs le standard de référence (Consensus Sleep Diary).
  Le module fusionne « heure de mise au lit / heure d'essai de dormir » en un seul
  champ, et « dernier réveil / sortie du lit » en un autre. L'efficacité du sommeil
  est donc calculée sur un Temps Passé au Lit approximatif.
- **Aucune visualisation côté praticien web** : le module retombait sur le panneau
  générique (dernier payload brut). Pas de grille, pas de tendance.
- **Deux infractions probables à la Règle d'Or MDR** : qualité et efficacité colorées
  en vert/orange/rouge par seuils côté patient (codage couleur de gravité + label
  interprétatif sur un score).
- **Design system contourné** : switch, compteurs, cartes, boutons réimplémentés à la
  main ; un seul fichier de 845 lignes (viole « un fichier = un composant »).
- **Sourçage scientifique partiel** : seul Trauer (2015) est cité, pas l'instrument
  réellement implémenté (Consensus Sleep Diary).

## 2. Sources scientifiques (vérifiées via PubMed)

- **Consensus Sleep Diary** — structure de référence adoptée.
  Carney CE, Buysse DJ, Ancoli-Israel S, Edinger JD, Krystal AD, Lichstein KL,
  Morin CM. *The consensus sleep diary: standardizing prospective sleep
  self-monitoring.* Sleep. 2012;35(2):287-302. PMID 22294820. doi:10.5665/sleep.1642
- **TCC-I = 1ʳᵉ ligne de l'insomnie chronique** (gains sur SOL, WASO, TST, SE +9,9 %).
  Trauer JM, Qian MY, Doyle JS, Rajaratnam SMW, Cunnington D. *Cognitive Behavioral
  Therapy for Chronic Insomnia: A Systematic Review and Meta-analysis.* Ann Intern
  Med. 2015;163(3):191-204. PMID 26054060. doi:10.7326/M14-2841
- **Agenda subjectif vs wearables** — l'auto-déclaration reste l'outil de la TCC-I ;
  les trackers grand public approchent l'actigraphie mais avec prudence.
  Hamill K, Jumabhoy R, Kahawage P, de Zambotti M, Walters EM, Drummond SPA. *J Sleep
  Res.* 2019;29(1):e12944. PMID 31680327. doi:10.1111/jsr.12944

## 3. Modèle de données (Core CSD + items psychiatrie)

Table SQLite `sleep_diary_entries` (mobile) — colonnes ajoutées par migration
additive (les entrées anciennes restent valides ; calculs en fallback) :

| Colonne | Type | CSD | Sens |
|---|---|---|---|
| `date` | TEXT UNIQUE | — | nuit enregistrée (YYYY-MM-DD) |
| `in_bed_time` | TEXT | Core | heure de mise au lit (**ajout**) |
| `bedtime` | TEXT | Core | heure d'essai de dormir (lumières éteintes) |
| `sleep_onset_minutes` | INTEGER | Core | latence d'endormissement (SOL) |
| `awakenings` | INTEGER | Core | nombre de réveils nocturnes |
| `awakenings_duration_minutes` | INTEGER | Core | durée totale des réveils (WASO) |
| `wake_time` | TEXT | Core | heure du dernier réveil |
| `out_of_bed_time` | TEXT | Core | heure de sortie du lit (**ajout**) |
| `quality` | INTEGER | Core | qualité subjective (1–5) |
| `restedness` | INTEGER | Expanded | ressenti au réveil (1–5) (**ajout**) |
| `nap_minutes` | INTEGER | Expanded | durée totale des siestes diurnes (**ajout**) |
| `sleep_aid` | INTEGER | Expanded | aide au sommeil prise (0/1) (**ajout**) |
| `nightmares` | INTEGER | — | cauchemars (0/1) |
| `notes` | TEXT | Core | commentaire libre |

**Calculs cliniques (faits afficher brut au patient, interprétés par le praticien)** :

- TPL (Temps Passé au Lit) = `out_of_bed_time` − `in_bed_time`
  (fallback : `wake_time` − `bedtime` si horaires CSD absents)
- TST (Temps de Sommeil Total) = (`wake_time` − `bedtime`) − SOL − WASO
- SE (Efficacité du Sommeil) = TST / TPL × 100

Sync : payload `sleep_diary_entry` étendu avec les nouveaux champs (`syncUpsert`).

## 4. Conformité MDR 2017/745

- **Côté patient** : valeurs brutes neutres uniquement. Suppression du codage couleur
  vert/orange/rouge sur la qualité, l'efficacité et le calendrier. Le calendrier
  encode au plus une intensité neutre (durée), pas un jugement bon/mauvais.
- **Côté praticien** : couleurs, seuils et tendances autorisés (score calculé pour le
  soignant). L'interprétation appartient exclusivement au praticien.
- Aucun seuil ne déclenche d'action, d'alerte ou de recommandation.

## 5. Mobile patient — refonte UI

Découpage du layout monolithique en sous-composants (dossier `SleepJournal/`), chacun
bâti sur le design system (`ui/Button`, `ui/Card`, `ui/InputField`, `ui/RatingSelector`,
`ui/Radio`, `ui/Chart`) :

- `SleepJournalLayout.tsx` — routeur de mode (liste / saisie / mois), état.
- `SleepListView.tsx` — CTA « saisir ma nuit », historique N nuits, accès mois.
- `SleepEntryView.tsx` — saisie d'une nuit : ruban horaires CSD + sections.
- `SleepMonthView.tsx` — calendrier mensuel (encodage neutre) + stats brutes.
- `sleepCalc.ts` — helpers purs (TPL, TST, SE, formatage) + tests.

Saisie : les 4 horaires CSD via pickers, latence/WASO/siestes en minutes, réveils en
compteur, qualité + ressenti en sélecteur, aide au sommeil + cauchemars en toggles,
notes libres. Saisie rapide, neutre, sans couleur de jugement.

## 6. Web praticien — visualisations réelles

Nouveau `kind = 'sleep'` dans la couche data (`engagementService` +
`engagementQueries` + `ModuleDataPanel`), alimenté par les `patient_entries`
synchronisées (lecture du payload `sleep_diary_entry`).

- **Grille agenda du sommeil** : barres horizontales 24h par nuit (artefact iconique
  TCC-I servant à poser la fenêtre de restriction).
- **Graphes de tendance** : efficacité du sommeil, TST, latence (SOL), WASO dans le
  temps (réutilise `ui/Chart` / `ModuleChart`).
- **Stats** : moyennes (durée, efficacité, réveils), régularité des horaires, nuits
  remplies, cauchemars, siestes, aide au sommeil.

## 7. i18n

Toutes les nouvelles clés `modules.sleep_diary.*` en `fr/en common.json` + `teen.json`
(tutoiement ado), best-effort `de/es/it/pt common.json`. Aucun texte en dur.

## 8. Tests & doc

- Mobile : `sleepCalc` (purs), `sleepDiaryService` (sync upsert/delete), rendu des vues.
- Web : service `fetchSleepEvolution`, `engagementQueries` sleep, panneau praticien.
- Mise à jour `docs/modules/sleep_diary.md` (nouveau modèle, sources, vues).
