// Contrats partagés des sous-vues de l'agenda du sommeil (sleep_diary).

import type { ContentField } from '@services/moduleService'

/** Résout une clé de config (`sleep_journal_config`) vers son libellé i18n traduit. */
export type Lbl = (key: string) => string

/** Bornes et paramètres numériques lus depuis `sleep_journal_config`. */
export interface SleepConfig {
  historyDays: number
  awakeningsMax: number
  onsetMaxMinutes: number
  awakDurationMaxMinutes: number
  napMaxMinutes: number
  qualityMax: number
}

export interface SleepJournalLayoutProps {
  /** Fields du module (config). */
  fields: ContentField[]
  /** Note de bas de page MDR (sources scientifiques) — affichée en mode liste. */
  footer?: ContentField
}
