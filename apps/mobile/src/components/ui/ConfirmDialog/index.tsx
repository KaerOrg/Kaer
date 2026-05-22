import React, { useEffect, useRef } from 'react'
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing } from '../../../theme'

export interface ConfirmDialogConfig {
  title: string
  message?: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
}

interface Props extends ConfirmDialogConfig {
  visible: boolean
  onCancel: () => void
  cancelLabel: string
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.94)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 120, friction: 9, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 130, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.94, duration: 130, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, opacity, scale])

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <Pressable onPress={() => {}} style={styles.inner}>
            <Text style={styles.title}>{title}</Text>
            {!!message && <Text style={styles.message}>{message}</Text>}
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.btnPressed]}
                onPress={onCancel}
              >
                <Text style={styles.btnCancelText}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  destructive ? styles.btnDestructive : styles.btnPrimary,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => { void Promise.resolve(onConfirm()) }}
              >
                <Text style={[styles.btnConfirmText, destructive && styles.btnDestructiveText]}>
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  inner: { padding: spacing.lg },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: colors.neutral,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnDestructive: {
    backgroundColor: colors.dangerLight,
  },
  btnPressed: {
    opacity: 0.75,
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.card,
  },
  btnDestructiveText: {
    color: colors.danger,
  },
})
