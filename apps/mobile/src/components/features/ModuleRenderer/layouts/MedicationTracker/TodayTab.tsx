import { useState, useCallback } from 'react'
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type { Medication } from '@kaer/shared'
import { Button } from '@ui/Button'
import { Chip } from '@ui/Chip'
import { colors } from '@theme'
import type { StatusMeta, ReasonMeta, IntakeState } from './types'
import { styles } from './styles'

interface Props {
  todayLabel: string
  dateValue: string
  isToday: boolean
  canGoNext: boolean
  onPrevDay: () => void
  onNextDay: () => void
  alreadySaved: boolean
  alreadySavedLabel: string
  question: string
  statusOptions: StatusMeta[]
  selectedStatus: string | null
  onSelectStatus: (value: string) => void
  // Motifs (affichés quand le statut n'est pas « pris »)
  showReasons: boolean
  reasonPrompt: string
  reasonOptions: ReasonMeta[]
  selectedReason: string | null
  onSelectReason: (value: string | null) => void
  showBridge: boolean
  bridgeLabel: string
  onOpenBridge: () => void
  // Détail par molécule
  medications: Medication[]
  perMoleculeLabel: string
  intakes: ReadonlyMap<string, IntakeState>
  onSetMoleculeStatus: (medicationId: string, status: string) => void
  kindLabel: (kind: Medication['kind']) => string
  // Notes
  notesLabel: string
  notesPlaceholder: string
  notes: string
  onChangeNotes: (value: string) => void
}

// Onglet « Aujourd'hui » — check global rapide (pastilles neutres) + détail
// optionnel par molécule + motif de non-prise + notes. Tous les éléments sont des
// faits déclarés par le patient ; aucune interprétation ni alerte (MDR 2017/745).
export function TodayTab({
  todayLabel, dateValue, isToday, canGoNext, onPrevDay, onNextDay,
  alreadySaved, alreadySavedLabel, question,
  statusOptions, selectedStatus, onSelectStatus,
  showReasons, reasonPrompt, reasonOptions, selectedReason, onSelectReason,
  showBridge, bridgeLabel, onOpenBridge,
  medications, perMoleculeLabel, intakes, onSetMoleculeStatus, kindLabel,
  notesLabel, notesPlaceholder, notes, onChangeNotes,
}: Props) {
  const [showDetail, setShowDetail] = useState(false)
  const toggleDetail = useCallback(() => setShowDetail(v => !v), [])

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Date — modifiable (chevrons) pour renseigner un jour oublié */}
      <View style={styles.dateHeader}>
        <View style={styles.dateNavRow}>
          <Pressable onPress={onPrevDay} hitSlop={10} style={styles.dateNavBtn} testID="prev-day" accessibilityLabel="prev-day">
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />
          </Pressable>
          <View style={styles.dateNavCenter}>
            {isToday && todayLabel ? <Text style={styles.dateLabel}>{todayLabel}</Text> : null}
            <Text style={styles.dateValue}>{dateValue}</Text>
          </View>
          <Pressable
            onPress={onNextDay}
            hitSlop={10}
            disabled={!canGoNext}
            style={[styles.dateNavBtn, !canGoNext && styles.dateNavBtnDisabled]}
            testID="next-day"
            accessibilityLabel="next-day"
          >
            <MaterialCommunityIcons name="chevron-right" size={26} color={canGoNext ? colors.primary : colors.border} />
          </Pressable>
        </View>
      </View>

      {alreadySaved && alreadySavedLabel ? (
        <View style={styles.savedBadge} testID="already-saved-badge">
          <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success} />
          <Text style={styles.savedBadgeText}>{alreadySavedLabel}</Text>
        </View>
      ) : null}

      {/* Check global */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question}</Text>
        <View style={styles.statusRow}>
          {statusOptions.map(opt => {
            const selected = selectedStatus === opt.value
            return (
              <Pressable
                key={opt.value}
                style={[styles.statusBtn, selected && { backgroundColor: opt.bgColor, borderColor: opt.color }]}
                onPress={() => onSelectStatus(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={opt.label}
                testID={`status-${opt.value}`}
              >
                <MaterialCommunityIcons name={opt.icon} size={22} color={selected ? opt.color : colors.border} />
                <Text style={[styles.statusLabel, selected && { color: opt.color }]}>{opt.label}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Motifs de non-prise */}
      {showReasons && reasonOptions.length > 0 ? (
        <View style={styles.notesSection}>
          <Text style={styles.sectionLabel}>{reasonPrompt}</Text>
          <View style={styles.chipsRow}>
            {reasonOptions.map(opt => {
              const selected = selectedReason === opt.value
              return (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={selected}
                  onPress={() => onSelectReason(selected ? null : opt.value)}
                  icon={
                    <MaterialCommunityIcons
                      name={opt.icon}
                      size={15}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                  }
                  testID={`reason-${opt.value}`}
                />
              )
            })}
          </View>
          {showBridge ? (
            <Button
              variant="secondary"
              size="sm"
              label={bridgeLabel}
              onPress={onOpenBridge}
              iconLeft={<MaterialCommunityIcons name="arrow-right-circle-outline" size={16} color={colors.primary} />}
              style={styles.bridgeBtnSelf}
              testID="side-effects-bridge"
            />
          ) : null}
        </View>
      ) : null}

      {/* Détail par molécule (optionnel) */}
      {medications.length > 0 ? (
        <View style={styles.notesSection}>
          <Pressable style={styles.molToggle} onPress={toggleDetail} testID="toggle-detail">
            <Text style={styles.molToggleText}>{perMoleculeLabel}</Text>
            <MaterialCommunityIcons
              name={showDetail ? 'chevron-up' : 'chevron-down'}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
          {showDetail ? (
            <View style={styles.list}>
              {medications.map(med => {
                const intake = intakes.get(med.id)
                return (
                  <View key={med.id} style={styles.molCard} testID={`mol-${med.id}`}>
                    <View style={styles.molHeader}>
                      <Text style={styles.molName}>{med.name}</Text>
                      <View style={styles.molKindBadge}>
                        <Text style={styles.molKindText}>{kindLabel(med.kind)}</Text>
                      </View>
                    </View>
                    {med.posology ? <Text style={styles.molPoso}>{med.posology}</Text> : null}
                    <View style={styles.statusRowCompact}>
                      {statusOptions.map(opt => {
                        const selected = intake?.status === opt.value
                        return (
                          <Pressable
                            key={opt.value}
                            style={[styles.statusBtnCompact, selected && { backgroundColor: opt.bgColor, borderColor: opt.color }]}
                            onPress={() => onSetMoleculeStatus(med.id, opt.value)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected }}
                            accessibilityLabel={opt.label}
                            testID={`mol-${med.id}-status-${opt.value}`}
                          >
                            <MaterialCommunityIcons name={opt.icon} size={18} color={selected ? opt.color : colors.border} />
                          </Pressable>
                        )
                      })}
                    </View>
                  </View>
                )
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Notes */}
      <View style={styles.notesSection}>
        <Text style={styles.sectionLabel}>{notesLabel}</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={onChangeNotes}
          placeholder={notesPlaceholder}
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          testID="notes-input"
        />
      </View>
    </ScrollView>
  )
}
