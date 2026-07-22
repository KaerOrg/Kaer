import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { EmptyState } from '@ui/EmptyState'
import { colors, spacing } from '@theme'
import { useTeen } from '../../../../../hooks/useTeen'
import type { DefusionSession } from '@services/defusionService'
import { DefusionHistoryRow } from './DefusionHistoryRow'

export interface DefusionHistoryProps {
  sessions: DefusionSession[]
  moduleId: string
  accent: string
  onClose: () => void
}

/** Un chiffre brut, ou « - » pour une mesure passée. */
function cell(value: number | null): string {
  return value === null ? '-' : String(value)
}

/**
 * Historique plein écran des séances de défusion. Chronologique, chiffres bruts
 * (« Inconfort 8 puis 5 », jamais « 8 → 5 » — MDR). Le mot / la pensée est MASQUÉ
 * par défaut : révélation ligne par ligne au tap, jamais globale. L'état de
 * révélation est local et se réinitialise au démontage (fermeture de la modale) :
 * fermer puis rouvrir l'historique remasque tout.
 */
export function DefusionHistory({ sessions, moduleId, accent, onClose }: DefusionHistoryProps) {
  const { isTeenMode } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const mk = useCallback((key: string) => `modules.${moduleId}.${key}`, [moduleId])

  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set())
  const reveal = useCallback(
    (id: string) => setRevealed((prev) => new Set(prev).add(id)),
    [],
  )

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{t(mk('history_title'))}</Text>
        <Button
          variant="ghost"
          onPress={onClose}
          iconLeft={<MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />}
          accessibilityLabel={t('common.close')}
          testID="defusion-history-close"
        />
      </View>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<MaterialCommunityIcons name="notebook-outline" size={40} color={colors.textMuted} />}
          title={t(mk('history_empty'))}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {sessions.map((s) => {
            const beforeSkipped = s.discomfort_before === null
            const afterSkipped = s.discomfort_after === null
            const measuresText = beforeSkipped && afterSkipped
              ? t(mk('history_measures_skipped'))
              : [
                  t(mk('history_pair'), { label: t(mk('measure_discomfort')), before: cell(s.discomfort_before), after: cell(s.discomfort_after) }),
                  t(mk('history_pair'), { label: t(mk('measure_belief')), before: cell(s.belief_before), after: cell(s.belief_after) }),
                ].join('  ·  ')
            return (
              <DefusionHistoryRow
                key={s.id}
                id={s.id}
                techniqueName={t(mk(`technique_${s.technique}_name`))}
                dotColor={s.technique === 'word_repetition' ? accent : colors.textMuted}
                durationSeconds={s.duration_seconds}
                dateLabel={new Date(s.created_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
                measuresText={measuresText}
                word={s.word_or_thought}
                revealed={revealed.has(s.id)}
                revealLabel={t(mk('history_reveal_word'))}
                onReveal={reveal}
              />
            )
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  title: { flex: 1, flexShrink: 1, fontSize: 20, fontWeight: '700', color: colors.text },
  list: { padding: spacing.lg, gap: spacing.md },
})
