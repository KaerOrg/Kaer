// Mode « historique » du primitive TreeSelector : bouton démarrer, intro,
// liste des entrées passées (view-models déjà résolus), état vide, note de pied.

import { View, Text, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@theme'
import { Button } from '../Button/Button'
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
      <Button
        variant="primary"
        onPress={onStartNew}
        label={texts.newBtn}
        iconLeft={<MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.text} />}
        accessibilityLabel={texts.newBtn}
        testID="start-new-button"
        style={styles.startBtnLayout}
      />

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
                    <MaterialCommunityIcons name={entry.icon} size={20} color={entry.accentColor} />
                  </View>
                  <View style={styles.entryLabels}>
                    {entry.primaryLabel ? (
                      <Text style={styles.entryPrimary}>{entry.primaryLabel}</Text>
                    ) : null}
                    {entry.secondaryLabel ? (
                      <Text style={styles.entrySecondary}>{entry.secondaryLabel}</Text>
                    ) : null}
                  </View>
                  <View style={styles.entryRight}>
                    {entry.intensityLabel != null ? (
                      <View style={styles.intensityBadge}>
                        <Text style={styles.intensityText}>{entry.intensityLabel}</Text>
                      </View>
                    ) : null}
                    <Button
                      variant="ghost"
                      onPress={() => onDelete(entry.id)}
                      accessibilityLabel={texts.delete}
                      iconLeft={<MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />}
                      testID={`delete-${entry.id}`}
                    />
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
