// ─── Layout `fields` — liste de lignes clé/valeur (aperçu lecture seule) ─────
//
// Rend une suite de `field_row` (libellé + widget non interactif) suivie d'une
// note de bas de page optionnelle dans un encart d'information.
// Conformité MDR 2017/745 : affichage passif, zéro interprétation.

import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../../../../theme'
import type { ContentField } from '../../../../../services/moduleService'
import { FieldRow, FieldText } from '../../fields'
import { styles } from './styles'

export interface FieldsLayoutProps {
  /** Lignes `field_row` à afficher. */
  fields: ContentField[]
  /** Note de bas de page optionnelle (`footer_note`). */
  footer: ContentField | undefined
}

export function FieldsLayout({ fields, footer }: FieldsLayoutProps) {
  return (
    <View>
      <View style={styles.fieldsBlock}>
        {fields.map(f => <FieldRow key={f.id} field={f} />)}
      </View>
      {footer && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <FieldText field={footer} />
        </View>
      )}
    </View>
  )
}
