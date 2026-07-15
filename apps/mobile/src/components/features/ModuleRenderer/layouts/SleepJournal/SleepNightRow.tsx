// Une ligne « nuit » de la liste de l'agenda du sommeil.
// Nuit renseignée : barre « fenêtre de sommeil » (segment coucher→lever dans une
// fenêtre de référence 18 h → midi), horaires, durée et étoiles de qualité.
// Nuit non saisie : invite discrète. Encodage neutre conforme MDR (le teal code
// « renseigné », jamais la qualité). Mémoïsé : rendu dans une liste de jours.

import { memo } from 'react'
import { View, Text, Pressable } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { computeSleepDuration, type SleepEntry } from '../../../../../lib/database'
import { formatDateShort } from '../../../../../lib/dateUtils'
import { computeSleepWindow } from './sleepHelpers'
import { styles } from './styles'

interface Props {
  date: string
  entry: SleepEntry | null
  qualityMax: number
  emptyLabel: string
  incompleteLabel: string
  onPress: (date: string) => void
}

function SleepNightRowInner({ date, entry, qualityMax, emptyLabel, incompleteLabel, onPress }: Props) {
  const window = entry ? computeSleepWindow(entry.bedtime, entry.wake_time) : null
  const filled = entry != null

  return (
    <Pressable
      style={[styles.nightRow, filled && styles.nightRowFilled]}
      onPress={() => onPress(date)}
      accessibilityRole="button"
      testID={`day-${date}`}
    >
      <View style={styles.nightHeader}>
        <Text style={[styles.nightDate, filled && styles.nightDateFilled]}>{formatDateShort(date)}</Text>
        {filled && entry.quality !== null ? (
          <View style={styles.starsRow}>
            {Array.from({ length: qualityMax }, (_, i) => (
              <MaterialCommunityIcons
                key={i}
                name={i < (entry.quality ?? 0) ? 'star' : 'star-outline'}
                size={13}
                color={i < (entry.quality ?? 0) ? colors.stars : colors.border}
              />
            ))}
          </View>
        ) : null}
      </View>

      {window && entry?.bedtime && entry?.wake_time ? (
        <>
          <View style={styles.windowTrack}>
            <View
              style={[styles.windowSegment, { left: `${window.leftPct}%`, width: `${window.widthPct}%` }]}
            />
          </View>
          <View style={styles.nightMeta}>
            <Text style={styles.nightTime}>{entry.bedtime}</Text>
            <Text style={styles.nightDuration}>
              {computeSleepDuration(entry.bedtime, entry.wake_time, entry.sleep_onset_minutes)}
            </Text>
            <Text style={styles.nightTime}>{entry.wake_time}</Text>
          </View>
        </>
      ) : filled ? (
        <Text style={styles.nightEmpty}>{incompleteLabel}</Text>
      ) : (
        <Text style={styles.nightEmpty}>{emptyLabel}</Text>
      )}
    </Pressable>
  )
}

export const SleepNightRow = memo(SleepNightRowInner)
