import React, { useMemo } from 'react'
import { Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { useAuthStore } from '../../store/authStore'
import { colors } from '../../theme'

interface InlineTextProps {
  code: string
  style?: object
}

// Resolves an i18n key from the 'psyedu' namespace.
// If teen mode is active and the key exists in 'psyedu_teen', that version is used.
// Renders **bold** markers as bold Text segments.
export function InlineText({ code, style }: InlineTextProps) {
  const isTeenMode = useAuthStore((s) => s.teenMode)
  const { t } = useTranslation()

  const text = useMemo(() => {
    if (isTeenMode && i18next.exists(code, { ns: 'psyedu_teen' })) {
      return i18next.t(code, { ns: 'psyedu_teen' })
    }
    return i18next.t(code, { ns: 'psyedu' })
  }, [code, isTeenMode, t])

  const parts = useMemo(() => text.split(/(\*\*[^*]+\*\*)/), [text])

  if (parts.length === 1) {
    return <Text style={[styles.base, style]}>{text}</Text>
  }

  return (
    <Text style={[styles.base, style]}>
      {parts.map((part, i) =>
        part.startsWith('**') ? (
          <Text key={i} style={styles.bold}>{part.slice(2, -2)}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  )
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 26,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
})
