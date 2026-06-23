import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Checkbox } from '../../../../../ui/Checkbox'

/** Aperçu en lecture seule d'un champ case à cocher (rendu statique, sans `onChange`). */
export function CheckboxWidget() {
  return (
    <View style={styles.wrap}>
      <Checkbox checked={false} label="Non accompli" />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { opacity: 0.7 },
})
