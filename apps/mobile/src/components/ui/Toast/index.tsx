import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, radius } from '@theme'

export type ToastVariant = 'success' | 'error' | 'info'

interface Props {
  message: string
  variant: ToastVariant
  visible: boolean
}

const BG: Record<ToastVariant, string> = {
  success: colors.success,
  error: colors.danger,
  info: colors.warning,
}

export default function Toast({ message, variant, visible }: Props) {
  const insets = useSafeAreaInsets()
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-16)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -16, duration: 180, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, opacity, translateY])

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + spacing.sm, backgroundColor: BG[variant] },
        { opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <View style={styles.dot} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 20,
  },
})
