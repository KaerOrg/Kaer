// Mode « historique » du primitive TreeSelector : bouton démarrer, intro,
// liste des entrées passées (view-models déjà résolus), état vide, note de pied.

import { View, Text, Pressable, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@theme'
import { Chip } from '../Chip/Chip'
import type { TreeSelectorEntry, TreeSelectorTexts } from './types'
import { styles } from './styles'

interface TreeSelectorHistoryProps {
  entries: TreeSelectorEntry[]
  texts: TreeSelectorTexts
  /** Note de bas de page (sources) — déjà traduite, optionnelle. */
  footerText?: string | null
  onStartNew: () => void
  onDelete: (id: string) => void
}

export function TreeSelectorHistory({ entries, texts, footerText, onStartNew, onDelete }: TreeSelectorHistoryProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.startBtn}
        onPress={onStartNew}
        accessibilityRole="button"
        accessibilityLabel={texts.newBtn}
        testID="start-new-button"
      >
        <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.white} />
        <Text style={styles.startBtnText}>{texts.newBtn}</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.historyContent}>
        {texts.intro ? (
          <View style={styles.introCard} testID="intro-card">
            <MaterialCommunityIcons name="palette" size={22} color={colors.primary} />
            <Text style={styles.introText}>{texts.intro}</Text>
          </View>
        ) : null}

        {entries.length === 0 ? (
          <View style={styles.empty} testID="list-empty">
            <MaterialCommunityIcons name="palette-outline" size={52} color={colors.border} />
            {texts.emptyTitle ? <Text style={styles.emptyTitle}>{texts.emptyTitle}</Text> : null}
            {texts.emptyText ? <Text style={styles.emptyText}>{texts.emptyText}</Text> : null}
          </View>
        ) : (
          <View style={styles.section}>
            {texts.historyLabel ? (
              <Text style={styles.sectionLabel}>{texts.historyLabel} ({entries.length})</Text>
            ) : null}
            {entries.map(entry => (
              <View
                key={entry.id}
                style={[styles.entryCard, { borderLeftColor: entry.accentColor }]}
                testID={`entry-card-${entry.id}`}
              >
                <View style={styles.entryHeader}>
                  <View style={[styles.entryIcon, { backgroundColor: entry.accentColor + '1A' }]}>
                    {entry.emoji ? (
                      <Text style={styles.entryEmoji}>{entry.emoji}</Text>
                    ) : (
                      <MaterialCommunityIcons name={entry.icon} size={20} color={entry.accentColor} />
                    )}
                  </View>
                  <View style={styles.entryLabels}>
                    {entry.primaryLabel ? (
                      <Text style={[styles.entryPrimary, { color: entry.accentColor }]}>{entry.primaryLabel}</Text>
                    ) : null}
                    {entry.secondaryLabel ? (
                      <Text style={styles.entrySecondary}>{entry.secondaryLabel}</Text>
                    ) : null}
                  </View>
                  <View style={styles.entryRight}>
                    {entry.intensityLabel != null ? (
                      <View style={[styles.intensityBadge, { backgroundColor: entry.accentColor + '1A' }]}>
                        <Text style={[styles.intensityText, { color: entry.accentColor }]}>
                          {entry.intensityLabel}
                        </Text>
                      </View>
                    ) : null}
                    <Pressable
                      onPress={() => onDelete(entry.id)}
                      accessibilityRole="button"
                      accessibilityLabel={texts.delete}
                      hitSlop={8}
                      testID={`delete-${entry.id}`}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>
                {entry.contextLabels.length > 0 ? (
                  <View style={styles.entryChips} testID={`chips-${entry.id}`}>
                    {entry.contextLabels.map((label, i) => (
                      <Chip key={`${entry.id}-ctx-${i}`} label={label} size="sm" muted />
                    ))}
                  </View>
                ) : null}
                {entry.notes ? (
                  <Text style={styles.entryNotes} numberOfLines={2}>{entry.notes}</Text>
                ) : null}
                <Text style={styles.entryDate}>{entry.dateLabel}</Text>
              </View>
            ))}
          </View>
        )}

        {footerText ? (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.footerText}>{footerText}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}
