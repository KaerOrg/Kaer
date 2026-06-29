import React from 'react'
import { View, StyleSheet } from 'react-native'
import { InputField } from '@ui/InputField'

// Aperçu (lecture seule) d'un champ texte long : `ui/InputField` non éditable en
// mode multiligne (label omis — porté par FieldRow). Atténué pour signaler
// l'aperçu. Aucun visuel ad hoc — la boîte vient du design system.
export function TextareaWidget() {
  return (
    <View style={styles.wrap}>
      <InputField editable={false} multiline numberOfLines={3} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { opacity: 0.5 },
})
