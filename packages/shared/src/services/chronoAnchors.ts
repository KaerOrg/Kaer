// Repères chronobiologiques : SOURCE UNIQUE web ≡ mobile (ordre canonique,
// couleur d'accent, clé i18n du libellé). Présentation partagée — les couleurs et
// l'ordre sont du code (palette catégorielle, pas du contenu éditable), mais ils
// doivent être UNIQUES pour garantir des légendes/vues identiques sur les deux
// plateformes. Les clés (`wake_time`…) restent en code car elles servent à lire le
// payload des saisies ; elles correspondent aux `module_content_fields` du seed.

export interface ChronoAnchorSpec {
  key: string
  /** Clé i18n du libellé court (légende, axes). */
  labelCode: string
  color: string
}

export const CHRONO_ANCHORS: readonly ChronoAnchorSpec[] = [
  { key: 'wake_time', labelCode: 'modules.chronobiology_tracker.anchor_wake', color: '#F59E0B' },
  { key: 'first_meal', labelCode: 'modules.chronobiology_tracker.anchor_first_meal', color: '#F97316' },
  { key: 'main_activity', labelCode: 'modules.chronobiology_tracker.anchor_main_activity', color: '#3B82F6' },
  { key: 'light', labelCode: 'modules.chronobiology_tracker.anchor_light', color: '#14B8A6' },
  { key: 'last_meal', labelCode: 'modules.chronobiology_tracker.anchor_last_meal', color: '#EF4444' },
  { key: 'bedtime', labelCode: 'modules.chronobiology_tracker.anchor_bedtime', color: '#8B5CF6' },
]

export const CHRONO_ANCHOR_KEYS: readonly string[] = CHRONO_ANCHORS.map(a => a.key)
