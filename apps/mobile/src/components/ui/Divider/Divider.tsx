import React from 'react'
import { View } from 'react-native'
import { styles } from './Divider.styles'
import type { DividerProps } from './Divider.types'

export const Divider = React.memo(function Divider({ inset = 0, style }: DividerProps) {
  return (
    <View
      style={[
        styles.base,
        inset > 0 && { marginHorizontal: inset },
        style,
      ]}
    />
  )
})
