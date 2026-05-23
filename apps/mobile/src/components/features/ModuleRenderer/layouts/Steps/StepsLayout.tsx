// ─── Layout `steps` — étapes numérotées (aperçu lecture seule) ───────────────
//
// Rend une liste verticale d'étapes, chacune = une `section_id` contenant un
// `step_title` (+ couleur/numéro optionnels) et un `step_hint` optionnel.
// Aucune interactivité, aucune persistance — purement présentation.
// Conformité MDR 2017/745 : affichage de contenu éditorial, zéro interprétation.

import { View, Text } from 'react-native'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldText } from '../../fields'
import { styles } from './styles'

export interface StepsLayoutProps {
  /** Étapes regroupées par `section_id` (ordre d'insertion = ordre d'affichage). */
  sections: Map<string, ContentField[]>
  /** Note de bas de page optionnelle (`footer_note`). */
  footer: ContentField | undefined
}

export function StepsLayout({ sections, footer }: StepsLayoutProps) {
  return (
    <View style={styles.stepsContainer}>
      {[...sections.entries()].map(([sectionId, fields], idx) => {
        const titleField = fields.find(f => f.field_type === 'step_title')
        const hintField = fields.find(f => f.field_type === 'step_hint')
        if (!titleField) return null
        const color = titleField.props['color'] ?? '#6366F1'
        const num = titleField.props['step_number'] ?? String(idx + 1)
        return (
          <View key={sectionId} style={styles.stepRow}>
            <View style={[styles.stepBadge, { backgroundColor: color }]}>
              <Text style={styles.stepNum}>{num}</Text>
            </View>
            <View style={styles.stepContent}>
              <FieldText field={titleField} />
              {hintField && <FieldText field={hintField} />}
            </View>
          </View>
        )
      })}
      {footer && <FieldText field={footer} />}
    </View>
  )
}
