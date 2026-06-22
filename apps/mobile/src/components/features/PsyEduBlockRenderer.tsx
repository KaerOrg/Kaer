import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native'
import i18next from 'i18next'
import { Lightbulb, ExternalLink, CheckCircle2, Check } from 'lucide-react-native'
import { useAuthStore } from '../../store/authStore'
import { InlineText } from './InlineText'
import { colors, spacing, radius } from '../../theme'
import type { PsyEduBlock } from '@psytool/shared'

interface Props {
  blocks: readonly PsyEduBlock[]
  accentColor?: string
}

function resolveText(code: string, isTeenMode: boolean): string {
  if (isTeenMode && i18next.exists(code, { ns: 'psyedu_teen' })) {
    return i18next.t(code, { ns: 'psyedu_teen' })
  }
  return i18next.t(code, { ns: 'psyedu' })
}

export function PsyEduBlockRenderer({ blocks, accentColor }: Props) {
  const isTeenMode = useAuthStore((s) => s.teenMode)
  const accent = accentColor ?? colors.primary

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
                    <View style={[styles.bulletDot, { backgroundColor: accent }]} />
                    <InlineText code={itemCode} style={styles.listText} />
                  </View>
                ))}
              </View>
            ) : null

          case 'action_list':
            return block.items_codes ? (
              <View key={block.id} style={[styles.actionCard, { borderColor: accent, backgroundColor: accent + '0D' }]}>
                <View style={styles.actionHeader}>
                  <CheckCircle2 size={18} color={accent} />
                  <Text style={[styles.actionTitle, { color: accent }]}>
                    {resolveText(block.text_code ?? 'section.actions', isTeenMode)}
                  </Text>
                </View>
                {block.items_codes.map((itemCode: string, i: number) => (
                  <View key={i} style={styles.actionItem}>
                    <Check size={15} color={accent} style={styles.actionCheck} />
                    <InlineText code={itemCode} style={styles.actionText} />
                  </View>
                ))}
              </View>
            ) : null

          case 'tip':
            return block.text_code ? (
              <View key={block.id} style={[styles.tip, { backgroundColor: accent + '18' }]}>
                <Lightbulb size={16} color={accent} style={styles.tipIcon} />
                <InlineText code={block.text_code} style={[styles.tipText, { color: accent }]} />
              </View>
            ) : null

          case 'blockquote':
            return block.text_code ? (
              <View key={block.id} style={[styles.blockquote, { borderLeftColor: accent }]}>
                <InlineText code={block.text_code} style={styles.blockquoteText} />
              </View>
            ) : null

          case 'source_link':
            return block.text_code ? (
              <Pressable
                key={block.id}
                style={({ pressed }) => [
                  styles.sourceCard,
                  { borderLeftColor: accent },
                  pressed && styles.sourceCardPressed,
                ]}
                onPress={block.href ? () => openLink(block.href!) : undefined}
                accessibilityRole="link"
              >
                <Text style={styles.sourceText}>
                  {resolveText(block.text_code, isTeenMode)}
                </Text>
                {block.href ? (
                  <ExternalLink size={14} color={accent} />
                ) : null}
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
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 9,
    flexShrink: 0,
  },
  listText: {
    flex: 1,
  },
  actionCard: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  actionCheck: {
    marginTop: 2,
    flexShrink: 0,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  tip: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  blockquoteText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  sourceCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sourceCardPressed: {
    opacity: 0.65,
  },
  sourceText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
})
