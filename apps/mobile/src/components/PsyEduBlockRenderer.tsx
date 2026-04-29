import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { useAuthStore } from '../store/authStore'
import { InlineText } from './InlineText'
import { colors, spacing, radius } from '../theme'
import type { PsyEduBlock } from 'shared'

interface Props {
  blocks: readonly PsyEduBlock[]
}

function resolveText(code: string, isTeenMode: boolean): string {
  if (isTeenMode && i18next.exists(code, { ns: 'psyedu_teen' })) {
    return i18next.t(code, { ns: 'psyedu_teen' })
  }
  return i18next.t(code, { ns: 'psyedu' })
}

export function PsyEduBlockRenderer({ blocks }: Props) {
  const isTeenMode = useAuthStore((s) => s.teenMode)
  const { t } = useTranslation()

  const openLink = useCallback((href: string) => {
    Linking.openURL(href).catch(() => undefined)
  }, [])

  return (
    <View>
      {blocks.map((block) => {
        switch (block.block_type) {
          case 'heading':
            return block.text_code ? (
              <Text key={block.id} style={styles.heading}>
                {resolveText(block.text_code, isTeenMode)}
              </Text>
            ) : null

          case 'paragraph':
            return block.text_code ? (
              <InlineText key={block.id} code={block.text_code} style={styles.paragraph} />
            ) : null

          case 'bullet_list':
            return block.items_codes ? (
              <View key={block.id} style={styles.list}>
                {block.items_codes.map((itemCode: string, i: number) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.bullet}>{'•'}</Text>
                    <InlineText code={itemCode} style={styles.listText} />
                  </View>
                ))}
              </View>
            ) : null

          case 'tip':
            return block.text_code ? (
              <View key={block.id} style={styles.tip}>
                <InlineText code={block.text_code} style={styles.tipText} />
              </View>
            ) : null

          case 'blockquote':
            return block.text_code ? (
              <View key={block.id} style={styles.blockquote}>
                <InlineText code={block.text_code} style={styles.blockquoteText} />
              </View>
            ) : null

          case 'source_link':
            return block.text_code ? (
              <Pressable
                key={block.id}
                style={({ pressed }) => [styles.sourceLink, pressed && styles.sourceLinkPressed]}
                onPress={block.href ? () => openLink(block.href!) : undefined}
                accessibilityRole="link"
              >
                <Text style={[styles.sourceLinkText, !block.href && styles.sourceLinkNoUrl]}>
                  {resolveText(block.text_code, isTeenMode)}
                </Text>
              </Pressable>
            ) : null

          default:
            return null
        }
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  paragraph: {
    marginBottom: spacing.sm,
  },
  list: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 26,
    width: 12,
  },
  listText: {
    flex: 1,
  },
  tip: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tipText: {
    color: colors.primary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    paddingLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  blockquoteText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  sourceLink: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  sourceLinkPressed: {
    opacity: 0.6,
  },
  sourceLinkText: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
  sourceLinkNoUrl: {
    color: colors.textMuted,
    textDecorationLine: 'none',
  },
})
