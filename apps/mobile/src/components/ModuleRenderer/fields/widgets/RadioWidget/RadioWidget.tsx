import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { radius } from '../../../../../theme'

type Variant = 'ok' | 'partial' | 'miss'

interface Config {
  label: string
  bg: string
  fg: string
  icon: React.ComponentProps<typeof Ionicons>['name']
}

const VARIANTS: Record<Variant, Config> = {
  ok:      { label: 'Pris',     bg: '#D1FAE5', fg: '#059669', icon: 'checkmark-outline' },
  partial: { label: 'Partiel',  bg: '#FEF3C7', fg: '#D97706', icon: 'remove-outline'    },
  miss:    { label: 'Non pris', bg: '#FEE2E2', fg: '#DC2626', icon: 'close-outline'     },
}

interface Props { variant: string }

export function RadioWidget({ variant }: Props) {
  const { label, bg, fg, icon } = VARIANTS[(variant as Variant)] ?? VARIANTS.ok
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={10} color={fg} />
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  label: { fontSize: 11, fontWeight: '600' },
})
