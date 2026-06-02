// ─── FieldRenderer — point d'entrée du moteur de rendu de module (mobile) ────
//
// Seule responsabilité : extraire un éventuel field `disclaimer_banner` et
// l'afficher au-dessus du layout principal, puis déléguer le rendu du contenu
// à `LayoutDispatcher`. Toute logique de layout vit dans `layouts/*` ;
// ne jamais l'ajouter ici.

import { View, StyleSheet } from 'react-native'
import { useAuthStore } from '../../../../store/authStore'
import { DisclaimerBanner } from '../../DisclaimerBanner'
import { LayoutDispatcher } from './LayoutDispatcher'
import type { FieldRendererProps } from './types'

export function FieldRenderer(props: FieldRendererProps) {
  const isTeenMode = useAuthStore(s => s.teenMode)
  const disclaimerField = props.fields.find(f => f.field_type === 'disclaimer_banner')
  const filteredFields = disclaimerField
    ? props.fields.filter(f => f.field_type !== 'disclaimer_banner')
    : props.fields

  const core = <LayoutDispatcher {...props} fields={filteredFields} />

  if (!disclaimerField) return core

  const moduleKey = disclaimerField.props['module_key'] || props.moduleId || ''
  return (
    <View style={styles.wrapper}>
      <DisclaimerBanner moduleKey={moduleKey} isTeenMode={isTeenMode} />
      <View style={styles.body}>{core}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  body: { flex: 1 },
})
