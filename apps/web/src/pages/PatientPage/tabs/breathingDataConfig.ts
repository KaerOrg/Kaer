import type { BreathingFeelingValue } from '@kaer/shared'

/**
 * Teintes d'**identité** des trois ressentis nommés, reprises de la palette de
 * l'epic #196.
 *
 * MDR 2017/745 : elles nomment un ressenti, elles ne le classent pas. Rien dans
 * l'écran ne les ordonne, ne les additionne ni ne les pondère : les barres empilées
 * affichent des effectifs bruts, côte à côte.
 *
 * À distinguer de l'écran de clôture mobile (M4), où les trois **choix** offerts au
 * patient portent une couleur unique : proposer un « bon » et un « mauvais » bouton
 * au moment de répondre orienterait la réponse. Ici, la saisie est faite.
 */
export const FEELING_COLORS: Record<BreathingFeelingValue, string> = {
  calmer: '#4A9EA3',
  same: '#D6DADF',
  tenser: '#E2926F',
}

/** Teinte des sessions sans ressenti : neutre, ce n'est pas une quatrième réponse. */
export const FEELING_UNANSWERED_COLOR = '#F3F4F6'

/**
 * Segments d'une barre de ressenti, dans un ordre **fixe**, jamais trié par effectif :
 * un ordre qui bougerait avec les données installerait une lecture de classement.
 */
export const FEELING_SEGMENTS = [
  { key: 'calmer', color: FEELING_COLORS.calmer },
  { key: 'same', color: FEELING_COLORS.same },
  { key: 'tenser', color: FEELING_COLORS.tenser },
] as const

/** Nom de fichier de l'export, horodaté pour ne pas écraser un export précédent. */
export function csvFileName(patientRef: string, isoDate: string): string {
  return `respiration_${patientRef}_${isoDate}.csv`
}

/**
 * Déclenche le téléchargement d'un CSV depuis le navigateur.
 *
 * Le BOM UTF-8 en tête est ce qui fait qu'Excel n'affiche pas « CohÃ©rence » à
 * l'ouverture : sans lui, il lit le fichier en Windows-1252.
 */
/** BOM UTF-8, écrit en échappement : le caractère brut est un espace invisible. */
const UTF8_BOM = '﻿'

export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob([`${UTF8_BOM}${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
