# Spec — Module « Rythmes & régularité » (refonte de `chronobiology_tracker`)

> Statut : **cadrage validé** (2026-06-15) — implémentation à venir sur la branche `refonte/chronobiologie`.
> Ce document est la feuille de route. Il sera tenu à jour à chaque phase.

## 1. Intention

Carnet de suivi des **rythmes sociaux quotidiens** (les « zeitgebers » comportementaux) dont
l'objet clinique est la **régularité des horaires de vie**. Complémentaire — et non concurrent —
de l'agenda du sommeil (`sleep_diary`).

Le module capture chaque jour 5 ancres horaires, en restitue l'historique de façon **neutre**
au patient, et fournit au praticien une **visualisation de la régularité + un indice calculé**
(chiffre brut) à discuter en consultation.

## 2. Pourquoi ce module (base scientifique)

- La **régularité** des rythmes veille/sommeil prédit la santé mieux que la *durée* de sommeil :
  index de régularité bas → +20 à +48 % de mortalité toutes causes (UK Biobank, 60 000+ sujets,
  actimétrie objective) [Windred 2023].
- L'irrégularité est associée à plus de symptômes dépressifs/anxieux, au risque cardiométabolique
  et au risque de démence (revue systématique 2025, 59 études) [Kalkanis 2025] ; incidence accrue
  de dépression majeure et d'anxiété généralisée sur wearables (*All of Us*, Nature Medicine)
  [Zheng 2024].
- Le journal des 5 ancres est le cœur de l'**IPSRT** (Interpersonal & Social Rhythm Therapy),
  dont l'efficacité sur la régularité et le fonctionnement social du trouble bipolaire est établie
  [Haynes 2016 ; Crowe 2020] ; versions numériques faisables [Swartz 2021, *RAY*].
- **Nuance clé** : l'auto-monitoring seul ne suffit pas (essai dépression ZELF-i négatif
  [Bastiaansen 2020]). → Le module sert l'**alliance et la conversation clinique**, pas
  l'autonomie. Aligné avec le positionnement carnet de bord de Kær.

Références complètes en bas de ce document.

## 3. Décisions de cadrage (verrouillées 2026-06-15)

| Sujet | Décision |
|---|---|
| Frontière avec `sleep_diary` | **Garder les 5 ancres sociales.** Objet = régularité des horaires de vie ; l'agenda du sommeil reste l'outil fin du sommeil (latence, efficacité, réveils). Deux objets cliniques distincts. |
| Indice de régularité praticien | **Oui — chiffre brut, côté praticien uniquement**, à la manière d'un score d'échelle. Aucun label, aucune couleur de gravité, aucune comparaison à une norme. |
| Onglet Fiches (psyedu) | **Retiré.** La psychoéducation vit dans son module dédié. Lien possible vers une fiche « Rythmes & régularité ». |
| Nom | **« Rythmes & régularité »** (clé i18n à créer, fr + en + teen). |
| **Ancres configurables par patient** | **Oui (MVP).** Le praticien choisit les ancres suivies pour ce patient. Réutilise le pattern `medication_side_effects` (effets configurables) / liste de médicaments. |
| **Ancre « lumière / sortie extérieure »** | **Oui (MVP), optionnelle.** Zeitgeber dominant [Dollish 2023]. Disponible dans le catalogue d'ancres configurables. |
| **Capture anti-friction** | **Principe de design de 1er ordre (MVP).** Saisie < 10 s, bouton « comme d'habitude » (reprise des horaires de la veille à ajuster), saisie rétroactive. |

## 4. Catalogue d'ancres (configurables par patient)

Ancres SRM de base : lever · premier repas · activité principale · dernier repas · coucher
(= Social Rhythm Metric-5 de l'IPSRT). Ancre additionnelle evidence-based : **lumière / sortie
extérieure** [Dollish 2023].

- Toutes **optionnelles** (saisie partielle permise).
- Le **praticien sélectionne par patient** le sous-ensemble d'ancres pertinent (on ne suit que
  l'utile → pertinence clinique + friction réduite). Catalogue d'ancres et sélection stockés en
  base (config-first), pas en dur.

## 4 bis. Principe de design — anti-friction (make-or-break)

L'auto-monitoring échoue par **abandon**, pas par manque de fonctionnalités (essai ZELF-i négatif
[Bastiaansen 2020]). La saisie est donc le facteur critique :

- Geste de saisie **< 10 secondes**, un seul écran.
- Bouton **« comme d'habitude »** : reprend les horaires de la veille, qu'on ajuste — pas un
  formulaire vierge à 5+ champs.
- Saisie **rétroactive** (remplir hier).
- Streak de **saisie** (engagement) autorisé ; streak de **régularité** (métrique clinique)
  **interdit** — cf. §5.

## 5. Conformité MDR 2017/745 — règle d'or

> Le code affiche, jamais il ne conclut.

| Surface | Autorisé | Interdit |
|---|---|---|
| **Vue patient** | horaires saisis en historique neutre ; visualisation « points par jour » montrant la dispersion sans la juger ; rappel d'horaire **fixe** (non conditionnel aux données) | tout score affiché au patient, tout label, toute alerte déclenchée par les données, toute comparaison à une norme, toute flèche/couleur de tendance |
| **Vue praticien** | indice de régularité **calculé** (chiffre brut, comme un score d'échelle) + nuage de points | label clinique, code couleur de gravité, flèche de tendance, seuil déclenchant une action |

## 6. Modèle de données (esquisse — config-first)

- Contenu/structure du module → **en base** (`module_content_fields` / `field_props`), jamais en
  tableau TS statique. Retirer du seed le tab `chrono.tab.fiches` ; conserver Journal + Mois.
- Saisie patient → SQLite local `chrono_entries` (offline-first) + `syncUpsert`/`syncDelete`
  (`entry_kind` à ajouter à l'union `EntryKind` de `syncOutbox.ts` **avant** d'écrire le service).
- Indice de régularité praticien : **calcul** (algorithme, pas donnée) — côté service/web, sur les
  entrées synchronisées. Méthode à arrêter en Phase 4 (candidat : variabilité jour-à-jour des
  ancres, type composite phase deviation / écart-type des horaires).

## 7. Feuille de route

| Phase | Contenu | Sortie attendue |
|---|---|---|
| **0 — Cadrage** | ✅ fait (ce document) | décisions verrouillées |
| **1 — Modèle & contenu** | nettoyer le seed (retirer tab Fiches) ; **catalogue d'ancres (5 SRM + lumière) + sélection par patient** en base ; clés i18n fr/en/teen ; `docs/modules/chronobiology_tracker.md` | seed + locales + doc |
| **2 — Web praticien** | ✅ **config des ancres suivies par patient** (service + hook + carte `ChronobiologyCard`) ; module déjà `tabbed`/débloquable. Reste : aperçu praticien avec visualisation de régularité → relève de Phase 4 | config ancres livrée |
| **3 — Mobile patient** | ✅ **capture anti-friction** (bouton « comme d'habitude », opt-in config-first) ; ✅ **filtrage des ancres selon `config.anchors`** (prop-drill `patientConfig` via `tabbed → column_form`) ; saisie/offline-first + sync + historique + vue mensuelle **déjà existants**. Reste : dette i18n EN/teen du contenu `chrono_bio` ; vérif mode ado | boucle praticien→patient bouclée |
| **4 — Restitution régularité** | visualisation neutre patient + indice calculé praticien ; tests ; doc | valeur clinique du module |
| **5 — Finitions** | lien fiche psyedu ; rappels horaires fixes ; streak de saisie (engagement) ; polish ; parité web ≡ mobile | module livrable |

## 8. Horizons (hors MVP — nommés, pas planifiés)

À traiter **après** le MVP, chacun avec son propre cadrage :

- **Superposition rythmes × humeur (vue praticien).** Juxtaposer visuellement la timeline de
  régularité avec le `mood_tracker` déjà saisi — **sans inférence causale**, juste l'image. Le
  « 1+1 = 3 » de Kær. Transverse → phase dédiée.
- **Cibles d'horaire « objectif vs réalisé ».** Cœur de l'IPSRT, mais risque de glissement vers le
  jugement (« objectif non atteint ») → cadrage MDR dédié obligatoire avant tout dev.
- **Ingestion wearable / actimétrie passive.** Gold standard scientifique et north star du module,
  mais gros chantier technique + implications HDS/RGPD majeures.

## 8 bis. Points ouverts (à trancher en Phase 4)

- Méthode exacte de l'indice de régularité (formule + fenêtre temporelle).
- Forme de la visualisation neutre patient (nuage de points vs bandes horaires).

## 9. Références

1. Windred DP et al. *Sleep regularity is a stronger predictor of mortality risk than sleep duration.* Sleep, 2023.
2. Kalkanis A et al. *Sleep regularity as an important component of sleep hygiene: a systematic review.* Sleep Medicine Reviews, 2025.
3. Zheng NS et al. *Sleep patterns and risk of chronic disease (wearables, All of Us).* Nature Medicine, 2024.
4. Cribb L et al. *Sleep regularity and mortality: a prospective analysis in the UK Biobank.* eLife, 2023.
5. St-Onge MP et al. *Multidimensional Sleep Health (AHA Scientific Statement).* Circ Cardiovasc Qual Outcomes, 2025.
6. Haynes PL et al. *Social Rhythm Therapies for Mood Disorders: an Update.* Curr Psychiatry Rep, 2016.
7. Crowe M et al. *Social rhythm therapy — a potentially translatable psychosocial intervention for bipolar disorder.* Bipolar Disord, 2020.
8. Swartz HA et al. *A Randomized Pilot Study of Rhythms And You (RAY).* J Affect Disord, 2021.
9. Bastiaansen JA et al. *Efficacy of EMI modules for depression (ZELF-i).* Psychological Medicine, 2020.
10. Dollish HK et al. *Circadian Rhythms and Mood Disorders: Time to See the Light.* Neuron, 2023.
