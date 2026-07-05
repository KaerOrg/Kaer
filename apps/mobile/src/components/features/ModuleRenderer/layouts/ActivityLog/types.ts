// Types partagés du dossier ActivityLog (behavioral_activation).

/** Résout un libellé UI depuis les props de `activity_log_config` (clé i18n → texte). */
export type LabelFn = (key: string) => string

/**
 * Brouillon remonté par EntryForm au layout à la sauvegarde.
 * P/M nullables : « non renseigné » est un état légitime (jamais de défaut à 5).
 * Attendus = prédiction à la planification ; ressentis = après réalisation.
 */
export interface ActivityDraft {
  id: string | null // null = création
  date: string // YYYY-MM-DD
  label: string
  expected_pleasure: number | null
  expected_mastery: number | null
  pleasure: number | null
  mastery: number | null
  done: boolean
  notes: string
  planned_time: string | null // HH:MM
  domain_id: string | null
  config_activity_id: string | null
}

/** Suggestion d'activité du seed, rattachée à un domaine de vie. */
export interface SuggestionItem {
  id: string
  text: string
  domainId: string | null
}

/** Domaine de vie du seed (field activity_log_domain). */
export interface DomainItem {
  id: string
  label: string
}
