// ─── Config « récit » + wizard du layout column_form (opt-in) ───────────────
//
// Lecture pure des props de `column_form_config` propres à la refonte 1B
// (#145). Ces réglages sont OPT-IN : seuls les modules qui les portent
// (beck_columns) activent le wizard et la carte récit ; les autres modules qui
// partagent `column_form` (craving_journal, chronobiology) gardent le scroll et
// la carte à puces génériques.
//
// Conformité MDR 2017/745 : la carte n'affiche que des valeurs brutes ; l'arc
// « avant → après » est un simple rapprochement de deux mesures, sans couleur de
// gravité ni flèche de tendance (le rendu neutre est appliqué côté composant).

/** Réglage de l'arc « avant → après » : deux clés de valeurs à rapprocher. */
export interface NarrativeArc {
  /** Clé de la valeur « avant » (ex. intensité émotion initiale). */
  beforeKey: string
  /** Clé de la valeur « après » (ex. intensité ré-évaluée). */
  afterKey: string
  /** Clé optionnelle d'un texte affiché sous les deux nombres (ex. émotion). */
  captionKey: string | null
  /** Unité affichée après chaque nombre (ex. « % »). */
  unit: string
  /** Code i18n du label « avant ». */
  beforeLabelCode: string
  /** Code i18n du label « après ». */
  afterLabelCode: string
  /** Code i18n de l'invite affichée quand la valeur « après » manque. */
  todoLabelCode: string
}

/** Config de la carte récit + de son arc. `null` = carte générique à puces. */
export interface NarrativeConfig {
  /** Clé de la valeur servant de titre (ex. situation). */
  titleKey: string | null
  /** Clé de la pensée barrée (« je pensais »). */
  strikeKey: string | null
  /** Code i18n du label de la pensée barrée. */
  strikeLabelCode: string
  /** Clé de la pensée alternative mise en avant (« je me dis »). */
  reframeKey: string | null
  /** Code i18n du label de la pensée alternative. */
  reframeLabelCode: string
  /** Code i18n du lien de dépliage (« voir le raisonnement complet »). */
  expandLabelCode: string
  /** Arc « avant → après », ou `null` si non configuré. */
  arc: NarrativeArc | null
}

/** `true` si la config demande la saisie en wizard « une question à la fois ». */
export function isWizardMode(configProps: Record<string, string> | undefined): boolean {
  return configProps?.['entry_mode'] === 'wizard'
}

/**
 * Lit la config de la carte récit depuis les props de `column_form_config`.
 * Retourne `null` si `list_card_variant` n'est pas `narrative` — le layout
 * retombe alors sur la carte générique à puces (`RecordCard`).
 */
export function readNarrativeConfig(
  configProps: Record<string, string> | undefined,
): NarrativeConfig | null {
  if (!configProps || configProps['list_card_variant'] !== 'narrative') return null

  const beforeKey = configProps['arc_before_key']
  const afterKey = configProps['arc_after_key']
  const arc: NarrativeArc | null =
    beforeKey && afterKey
      ? {
          beforeKey,
          afterKey,
          captionKey: configProps['arc_caption_key'] || null,
          unit: configProps['arc_unit'] ?? '',
          beforeLabelCode: configProps['arc_before_label'] ?? '',
          afterLabelCode: configProps['arc_after_label'] ?? '',
          todoLabelCode: configProps['arc_todo_label'] ?? '',
        }
      : null

  return {
    titleKey: configProps['narrative_title_key'] || null,
    strikeKey: configProps['narrative_strike_key'] || null,
    strikeLabelCode: configProps['narrative_strike_label'] ?? '',
    reframeKey: configProps['narrative_reframe_key'] || null,
    reframeLabelCode: configProps['narrative_reframe_label'] ?? '',
    expandLabelCode: configProps['narrative_expand_label'] ?? '',
    arc,
  }
}
