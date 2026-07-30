// Mode « historique » du primitive TreeSelector : bouton démarrer, ligne de rappel,
// entrées passées groupées par jour, état vide.
//
// Conformité MDR 2017/745 : le groupement par jour est une **navigation**, pas une
// analyse. Aucun total par groupe, aucune moyenne, aucune comparaison d'un jour à
// l'autre, aucune flèche d'évolution. La liste reste chronologique et brute.
//
// La psychoéducation et le disclaimer sourcé ne sont plus collés en permanence sur
// cet écran : ils vivent dans la fiche ⓘ de l'en-tête, ouverte à la demande (K-3).

import { View, Text, Pressable, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '../Button'
import { Chip } from '../Chip/Chip'
import type { TreeSelectorEntrySection, TreeSelectorTexts } from './types'
import { styles } from './styles'

interface TreeSelectorHistoryProps {
  /** Entrées groupées par jour, déjà titrées et ordonnées par le parent. */
  sections: TreeSelectorEntrySection[]
  texts: TreeSelectorTexts
  /** Ligne « Prochain rappel : … », absente si aucun rappel n'est programmé. */
  nextReminderLabel?: string | null
  /** Ouvre le réglage des rappels. Absent : la ligne n'affiche pas d'action. */
  onEditReminder?: () => void
  onStartNew: () => void
  /** Ouvre la fiche ⓘ du module. Absent : l'icône n'est pas rendue. */
  onOpenInfo?: () => void
  /** Ouvre le menu d'une entrée (modifier / supprimer). */
  onOpenEntryMenu: (id: string) => void
}

export function TreeSelectorHistory({
  sections, texts, nextReminderLabel, onEditReminder,
  onStartNew, onOpenInfo, onOpenEntryMenu,
}: TreeSelectorHistoryProps) {
  const isEmpty = sections.every(s => s.entries.length === 0)

  return (
    <View style={styles.container}>
      {onOpenInfo ? (
        <View style={styles.historyHeader}>
          <Button
            variant="ghost"
            onPress={onOpenInfo}
            accessibilityLabel={texts.infoBtn}
            testID="open-info"
            iconLeft={
              <MaterialCommunityIcons
                name="information-outline"
                size={22}
                color={colors.textMuted}
              />
            }
          />
        </View>
      ) : null}

      <Pressable
        style={styles.startBtn}
        onPress={onStartNew}
        accessibilityRole="button"
        accessibilityLabel={texts.newBtn}
        testID="start-new-button"
      >
        <MaterialCommunityIcons name="plus" size={20} color={colors.text} />
        <Text style={styles.startBtnText}>{texts.newBtn}</Text>
      </Pressable>

      {nextReminderLabel ? (
        <View style={styles.reminderRow} testID="next-reminder">
          <Text style={styles.reminderText} numberOfLines={2}>{nextReminderLabel}</Text>
          {onEditReminder ? (
            <Button
              variant="ghost"
              size="sm"
              label={texts.editReminderBtn}
              onPress={onEditReminder}
              testID="edit-reminder"
            />
          ) : null}
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.historyContent}>
        {isEmpty ? (
          <View style={styles.empty} testID="list-empty">
            <MaterialCommunityIcons name="text-box-outline" size={52} color={colors.border} />
            {texts.emptyTitle ? <Text style={styles.emptyTitle}>{texts.emptyTitle}</Text> : null}
            {texts.emptyText ? <Text style={styles.emptyText}>{texts.emptyText}</Text> : null}
          </View>
        ) : (
          sections.filter(s => s.entries.length > 0).map(section => (
            <View key={section.title} style={styles.section} testID={`day-${section.title}`}>
              <Text style={styles.sectionLabel}>{section.title}</Text>
              {section.entries.map(entry => (
                <View
                  key={entry.id}
                  style={[styles.entryCard, { borderLeftColor: entry.accentColor }]}
                  testID={`entry-card-${entry.id}`}
                >
                  <View style={styles.entryHeader}>
                    <View style={styles.entryLabels}>
                      <View style={styles.entryTitleRow}>
                        {entry.primaryLabel ? (
                          <Text style={styles.entryPrimary}>{entry.primaryLabel}</Text>
                        ) : null}
                        {entry.secondaryLabel ? (
                          <Text style={styles.entrySecondary}> · {entry.secondaryLabel}</Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.entryRight}>
                      {entry.intensityLabel != null ? (
                        <Text style={styles.intensityText}>{entry.intensityLabel}</Text>
                      ) : null}
                      <Button
                        variant="ghost"
                        onPress={() => onOpenEntryMenu(entry.id)}
                        accessibilityLabel={texts.entryMenuBtn}
                        testID={`menu-${entry.id}`}
                        iconLeft={
                          <MaterialCommunityIcons
                            name="dots-horizontal"
                            size={20}
                            color={colors.textMuted}
                          />
                        }
                      />
                    </View>
                  </View>
                  {entry.notes ? (
                    <Text style={styles.entryNotes} numberOfLines={2}>{entry.notes}</Text>
                  ) : null}
                  <View style={styles.entryFooter}>
                    <Text style={styles.entryDate}>{entry.dateLabel}</Text>
                    {entry.contextLabels.length > 0 ? (
                      <View style={styles.entryChips} testID={`chips-${entry.id}`}>
                        {entry.contextLabels.map((label, i) => (
                          <Chip key={`${entry.id}-ctx-${i}`} label={label} size="sm" muted />
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
