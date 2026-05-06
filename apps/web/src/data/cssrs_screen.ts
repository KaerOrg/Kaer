// Columbia Suicide Severity Rating Scale (C-SSRS) — Version « Depuis la dernière visite »
// Posner K, Brent D, Lucas C, Gould M, Stanley B, Brown G, Fisher P, Zelazny J, Burke A,
// Oquendo M, Mann J — Am J Psychiatry 2011;168(12):1266-1277.
// https://pubmed.ncbi.nlm.nih.gov/22193671/
// Traduction française officielle : Mapi Research Trust (ICON Language Services).
// Référence document : C-SSRS-SinceLastVisit_FR_20160111_CBY — Version du 11 Jan 2016.
// © 2008 The Research Foundation for Mental Hygiene, Inc.
// Accès aux traductions officielles : https://cssrs.columbia.edu/translations/
//
// Arbre décisionnel (source : instructions officielles du formulaire) :
//   Poser Q1 et Q2.
//   Si Q1 = Non ET Q2 = Non → passer directement à « Comportements suicidaires ».
//   Si Q1 = Oui OU Q2 = Oui → compléter la section « Intensité de l'idéation ».
//   Si Q2 = Oui → poser Q3, Q4 et Q5.
//   Section Comportements (B1–B4) : toujours posée, indépendamment de l'idéation.

// ─── Types de base ────────────────────────────────────────────────────────────

export interface CSSRSItem {
  readonly label: string           // intitulé clinique de la catégorie
  readonly question: string        // formulation exacte à poser au patient
  readonly dependsOnPrev: boolean  // vrai si l'item ne s'active que si le précédent = Oui
}

export interface CSSRSSection {
  readonly key: 'ideation' | 'behavior'
  readonly title: string
  readonly period: string
  readonly items: readonly CSSRSItem[]
}

// ─── Données idéation & comportements ────────────────────────────────────────

export const CSSRS_SECTIONS: readonly CSSRSSection[] = [
  {
    key: 'ideation',
    title: 'Idéation suicidaire',
    period: 'Depuis la dernière visite',
    items: [
      {
        label: 'Désir d\'être mort(e)',
        question: 'Avez-vous souhaité être mort(e) ou vous endormir et ne jamais vous réveiller ?',
        dependsOnPrev: false,
      },
      {
        label: 'Idéation suicidaire non spécifique',
        question: 'Avez-vous réellement pensé à vous suicider ?',
        dependsOnPrev: false,
      },
      {
        label: 'Idéation avec méthode (sans scénario, sans intention)',
        question: 'Avez-vous pensé à la manière dont vous vous y prendriez ?',
        dependsOnPrev: true,
      },
      {
        label: 'Idéation avec intention (sans scénario précis)',
        question: 'Avez-vous eu des pensées de ce genre et l\'intention de passer à l\'acte ?',
        dependsOnPrev: true,
      },
      {
        label: 'Idéation avec scénario précis et intention',
        question: 'Avez-vous commencé ou fini d\'élaborer un scénario détaillé sur la manière dont vous voulez vous suicider ? Avez-vous l\'intention de mettre ce scénario à exécution ?',
        dependsOnPrev: true,
      },
    ],
  },
  {
    key: 'behavior',
    title: 'Comportements suicidaires',
    period: 'Depuis la dernière visite',
    items: [
      {
        label: 'Tentative avérée',
        question: 'Avez-vous fait une tentative de suicide ?',
        dependsOnPrev: false,
      },
      {
        label: 'Tentative interrompue',
        question: 'Vous est-il arrivé de commencer à faire quelque chose pour tenter de mettre fin à vos jours, mais d\'en être empêché(e) par quelqu\'un ou quelque chose avant de véritablement passer à l\'acte ?',
        dependsOnPrev: false,
      },
      {
        label: 'Tentative avortée',
        question: 'Vous est-il arrivé de commencer à faire quelque chose pour tenter de mettre fin à vos jours, mais de vous arrêter de vous-même avant de véritablement passer à l\'acte ?',
        dependsOnPrev: false,
      },
      {
        label: 'Préparatifs',
        question: 'Avez-vous pris certaines mesures pour faire une tentative de suicide ou pour préparer votre suicide (par ex. rassembler des comprimés, vous procurer une arme à feu, donner vos objets de valeur ou écrire une lettre d\'adieu) ?',
        dependsOnPrev: false,
      },
    ],
  },
]

export const CSSRS_TOTAL = 9
export const CSSRS_IDEATION_COUNT = 5
export const CSSRS_BEHAVIOR_COUNT = 4

// ─── Arbre décisionnel ────────────────────────────────────────────────────────

/**
 * Détermine si un item d'idéation (index 0–4) doit être posé.
 * Q1 (0) et Q2 (1) : toujours posées.
 * Q3–Q5 (2–4) : actifs uniquement si toutes les réponses précédentes à partir de Q2 sont Oui.
 * Appelé avec un tableau de 5 valeurs (réponses idéation uniquement).
 */
export function isIdeationItemActive(absIndex: number, ideationValues: (0 | 1 | null)[]): boolean {
  if (absIndex <= 1) return true
  for (let i = 1; i < absIndex; i++) {
    if (ideationValues[i] !== 1) return false
  }
  return true
}

// Alias rétrocompatible (ancienne API, utilisée dans les tests existants)
export function isAbsoluteItemActive(absIndex: number, answers: (0 | 1 | null)[]): boolean {
  if (absIndex >= CSSRS_IDEATION_COUNT) return true
  return isIdeationItemActive(absIndex, answers)
}

// ─── Calcul des scores ────────────────────────────────────────────────────────

/** Niveau d'idéation maximal atteint (0–5). Valeur brute — conformité MDR 2017/745. */
export function computeIdeationLevel(answers: number[]): number {
  for (let i = CSSRS_IDEATION_COUNT - 1; i >= 0; i--) {
    if (answers[i] === 1) return i + 1
  }
  return 0
}

/** Nombre de comportements suicidaires positifs (0–4). Valeur brute — conformité MDR 2017/745. */
export function computeBehaviorCount(answers: number[]): number {
  return answers.slice(CSSRS_IDEATION_COUNT, CSSRS_TOTAL).reduce((sum, a) => sum + a, 0)
}

/** Nombre d'items d'idéation positifs (0–5). Valeur brute — conformité MDR 2017/745. */
export function computeIdeationCount(answers: number[]): number {
  return answers.slice(0, CSSRS_IDEATION_COUNT).reduce((sum, a) => sum + a, 0)
}

// ─── Intensité de l'idéation ──────────────────────────────────────────────────
// Section obligatoire quand Q1 = Oui OU Q2 = Oui.
// Cotée par le praticien selon l'idéation la plus grave endorsée.

export interface LikertOption {
  readonly value: number
  readonly label: string
  readonly detail: string
}

export interface IntensiteDimension {
  readonly key: 'frequence' | 'duree' | 'maitrise' | 'dissuasifs' | 'causes'
  readonly title: string
  readonly options: readonly LikertOption[]
}

export const INTENSITE_DIMENSIONS: readonly IntensiteDimension[] = [
  {
    key: 'frequence',
    title: 'Fréquence',
    options: [
      { value: 1, label: 'Rarement',         detail: 'Moins d\'une fois par semaine' },
      { value: 2, label: 'Parfois',            detail: 'Une fois par semaine' },
      { value: 3, label: 'Souvent',           detail: '2 à 5 fois par semaine' },
      { value: 4, label: 'Fréquemment',       detail: 'Tous les jours ou presque' },
      { value: 5, label: 'Constamment',       detail: 'Plusieurs fois par jour' },
    ],
  },
  {
    key: 'duree',
    title: 'Durée',
    options: [
      { value: 1, label: 'Transitoire',       detail: 'Quelques secondes ou minutes (moins d\'1 heure)' },
      { value: 2, label: 'Courte durée',      detail: 'Moins d\'1 heure, quelques heures' },
      { value: 3, label: 'Modérée',           detail: '1 à 4 heures' },
      { value: 4, label: 'Longue',            detail: '4 à 8 heures' },
      { value: 5, label: 'Persistante',       detail: 'Plus de 8 heures (idéation continue)' },
    ],
  },
  {
    key: 'maitrise',
    title: 'Maîtrise des pensées suicidaires',
    options: [
      { value: 0, label: 'N/A',               detail: 'N\'a pas d\'idéation (ne s\'applique pas)' },
      { value: 1, label: 'Facile',            detail: 'Peut détourner son attention quand il/elle veut' },
      { value: 2, label: 'Peu difficile',     detail: 'Peut les maîtriser avec un peu d\'effort' },
      { value: 3, label: 'Difficile',         detail: 'Peut les maîtriser avec beaucoup d\'effort' },
      { value: 4, label: 'Très difficile',    detail: 'Peut difficilement contrôler les pensées' },
      { value: 5, label: 'Impossible',        detail: 'Incapable de maîtriser — pensées complètement envahissantes' },
    ],
  },
  {
    key: 'dissuasifs',
    title: 'Éléments dissuasifs',
    options: [
      { value: 0, label: 'N/A',               detail: 'N\'a pas d\'idéation suicidaire' },
      { value: 1, label: 'Définitivement',    detail: 'Ont définitivement empêché tout passage à l\'acte' },
      { value: 2, label: 'Probablement',      detail: 'Les ont probablement empêché(e)' },
      { value: 3, label: 'Incertains',        detail: 'Incertitude quant à leur capacité à l\'empêcher' },
      { value: 4, label: 'Insuffisants',      detail: 'N\'ont probablement pas empêché tout passage à l\'acte' },
      { value: 5, label: 'Inefficaces',       detail: 'N\'ont pas du tout empêché / aucun élément dissuasif' },
    ],
  },
  {
    key: 'causes',
    title: 'Causes de l\'idéation',
    options: [
      { value: 0, label: 'N/A',               detail: 'N\'a pas d\'idéation suicidaire' },
      { value: 1, label: 'Uniquement autrui', detail: 'Uniquement pour faire souffrir autrui / attirer l\'attention / se venger' },
      { value: 2, label: 'Surtout autrui',    detail: 'Principalement pour faire souffrir autrui / attirer l\'attention / se venger' },
      { value: 3, label: 'Équilibre',         detail: 'Mélange équivalent — faire souffrir autrui ET mettre fin à la douleur propre' },
      { value: 4, label: 'Surtout soi',       detail: 'Principalement pour mettre fin à la douleur propre (émotionnelle ou physique)' },
      { value: 5, label: 'Uniquement soi',    detail: 'Uniquement pour mettre fin à la douleur propre' },
    ],
  },
]

// ─── Létalité ─────────────────────────────────────────────────────────────────
// Pour la tentative la plus létale (section Comportements suicidaires).

export const LETALITE_OBSERVEE_OPTIONS: readonly LikertOption[] = [
  { value: 0, label: '0', detail: 'Absence de lésions ou lésions très légères (premiers soins uniquement, pas d\'hospitalisation)' },
  { value: 1, label: '1', detail: 'Lésions légères (ex. brûlures superficielles) — soins médicaux requis, sans hospitalisation' },
  { value: 2, label: '2', detail: 'Lésions modérées (ex. ingestion consciente de médicaments) — hospitalisation nécessaire' },
  { value: 3, label: '3', detail: 'Lésions modérément sévères (ex. inconscience, vomissements, brûlures 2e degré) — réanimation nécessaire' },
  { value: 4, label: '4', detail: 'Lésions sévères (dommages neurologiques, anoxie, arrêt cardiaque) — réanimation intensive' },
  { value: 5, label: '5', detail: 'Décès' },
]

export const LETALITE_POTENTIELLE_OPTIONS: readonly LikertOption[] = [
  { value: 0, label: '0', detail: 'La personne pensait que le comportement ne pouvait pas entraîner de lésions' },
  { value: 1, label: '1', detail: 'La personne n\'était pas certaine que le comportement pouvait entraîner des lésions ou la mort' },
  { value: 2, label: '2', detail: 'La personne pensait que le comportement entraînerait très probablement la mort ou des lésions graves' },
]
