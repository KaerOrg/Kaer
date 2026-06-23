import React, { useEffect, useRef } from 'react'
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius, spacing } from '@theme'

export interface ActionSheetOption {
  label: string
  onPress: () => void
  destructive?: boolean
}

export interface ActionSheetConfig {
  title?: string
  options: ActionSheetOption[]
  cancelLabel: string
}

interface Props extends ActionSheetConfig {
  visible: boolean
  onClose: () => void
}

export default function ActionSheet({ visible, title, options, cancelLabel, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(300)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, tension: 100, friction: 10, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 300, duration: 180, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, translateY, opacity])

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.sm, transform: [{ translateY }] },
          ]}
        >
          {!!title && <Text style={styles.title}>{title}</Text>}
          {options.map((opt, i) => (
            <View key={i}>
              {(i > 0 || !!title) && <View style={styles.separator} />}
              <Pressable
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => { onClose(); opt.onPress() }}
              >
                <Text style={[styles.optionText, opt.destructive && styles.optionDestructive]}>
                  {opt.label}
                </Text>
              </Pressable>
            </View>
          ))}
          <View style={styles.cancelWrapper}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.optionPressed]}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  optionPressed: {
    opacity: 0.55,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  optionDestructive: {
    color: colors.danger,
  },
  cancelWrapper: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.neutral,
    marginBottom: 2,
  },
  cancelBtn: {
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
})
