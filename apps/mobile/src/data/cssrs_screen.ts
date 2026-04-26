// Columbia Suicide Severity Rating Scale (C-SSRS) — Version « Depuis la dernière visite »
// Posner K, Brent D, Lucas C, Gould M, Stanley B, Brown G, Fisher P, Zelazny J, Burke A,
// Oquendo M, Mann J — Am J Psychiatry 2011;168(12):1266-1277.
// https://pubmed.ncbi.nlm.nih.gov/22193671/
// Traduction française officielle : Mapi Research Trust (ICON Language Services).
// Référence document : C-SSRS-SinceLastVisit_AU5.1_fra-FR — Version du 07 Apr 14.
// © 2008 The Research Foundation for Mental Hygiene, Inc.
// Accès aux traductions officielles : https://cssrs.columbia.edu/translations/
//
// Arbre décisionnel (source : instructions officielles du formulaire) :
//   Poser Q1 et Q2.
//   Si les deux réponses sont négatives → passer directement à « Comportements ».
//   Si Q2 = Oui → poser Q3, Q4 et Q5.
//   Section Comportements (B1–B4) : toujours posée, indépendamment de l'idéation.

// ─── Structure ────────────────────────────────────────────────────────────────

export interface CSSRSItem {
  readonly label: string           // intitulé clinique de la catégorie
  readonly question: string        // formulation exacte à poser au patient
  readonly dependsOnPrev: boolean  // vrai si l'item ne s'active que si le précédent = Oui
}

export interface CSSRSScreenSection {
  readonly key: 'ideation' | 'behavior'
  readonly title: string
  readonly period: string
  readonly items: readonly CSSRSItem[]
}

export interface CSSRSScreenData {
  readonly id: string
  readonly sections: readonly CSSRSScreenSection[]
}

// ─── Données validées ─────────────────────────────────────────────────────────

export const CSSRS_SCREEN_DATA: CSSRSScreenData = {
  id: 'cssrs_screen',
  sections: [
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
  ],
} as const

// Réponses binaires
export const CSSRS_BINARY_OPTIONS = [
  { text: 'Non', value: 0 },
  { text: 'Oui', value: 1 },
] as const

export const CSSRS_SCREEN_TOTAL = 9
export const CSSRS_IDEATION_COUNT = 5
export const CSSRS_BEHAVIOR_COUNT = 4

// ─── Arbre décisionnel ────────────────────────────────────────────────────────

/**
 * Détermine si un item d'idéation (index 0–4) doit être posé.
 * Q1 (0) et Q2 (1) : toujours posées.
 * Q3–Q5 (2–4) : actifs uniquement si toutes les réponses précédentes à partir de Q2 sont Oui.
 */
export function isIdeationItemActive(absIndex: number, ideationValues: (0 | 1 | null)[]): boolean {
  if (absIndex <= 1) return true
  for (let i = 1; i < absIndex; i++) {
    if (ideationValues[i] !== 1) return false
  }
  return true
}

/**
 * Détermine si un item (index absolu 0–8) doit être posé selon l'arbre décisionnel.
 * Comportements (5–8) : toujours posés.
 * Q1 et Q2 (indices 0–1) : toujours posées.
 * Q3–Q5 (indices 2–4) : actifs uniquement si toutes les réponses précédentes en idéation
 * à partir de Q2 (indice 1) sont Oui.
 */
export function isAbsoluteItemActive(absIndex: number, answers: (0 | 1 | null)[]): boolean {
  if (absIndex >= CSSRS_IDEATION_COUNT) return true
  return isIdeationItemActive(absIndex, answers)
}

// ─── Calcul des scores ────────────────────────────────────────────────────────

/**
 * Niveau d'idéation maximal atteint (0–5).
 * Valeur brute sans interprétation — conformité MDR 2017/745.
 */
export function computeIdeationLevel(answers: number[]): number {
  for (let i = CSSRS_IDEATION_COUNT - 1; i >= 0; i--) {
    if (answers[i] === 1) return i + 1
  }
  return 0
}

/**
 * Nombre de comportements suicidaires positifs (0–4).
 * Valeur brute sans interprétation — conformité MDR 2017/745.
 */
export function computeBehaviorCount(answers: number[]): number {
  return answers.slice(CSSRS_IDEATION_COUNT, CSSRS_SCREEN_TOTAL).reduce((sum, a) => sum + (a ?? 0), 0)
}

/**
 * Nombre d'items d'idéation positifs (0–5).
 * Valeur brute sans interprétation — conformité MDR 2017/745.
 */
export function computeIdeationCount(answers: number[]): number {
  return answers.slice(0, CSSRS_IDEATION_COUNT).reduce((sum, a) => sum + (a ?? 0), 0)
}
