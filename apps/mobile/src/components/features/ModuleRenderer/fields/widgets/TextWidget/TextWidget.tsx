import React from 'react'
import { View, StyleSheet } from 'react-native'
import { InputField } from '@ui/InputField'

// Aperçu (lecture seule) d'un champ texte : champ non éditable rendu par le
// primitive `ui/InputField` (label omis — porté par FieldRow). Atténué pour
// signaler l'aperçu. Aucun visuel ad hoc — la boîte vient du design system.
export function TextWidget() {
  return (
    <View style={styles.wrap}>
      <InputField editable={false} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { opacity: 0.6 },
})
