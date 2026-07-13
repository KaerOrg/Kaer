// ─── DayTimelineCard — carte « frise 24 h » du Journal chronobiologique ─────
//
// Une carte par jour : les repères horaires renseignés sont posés à leur heure
// exacte sur une frise 0 h → 24 h (pastille couleur + icône d'ancre). Au dépli,
// le détail s'affiche en lignes « icône + libellé + heure ». Couleurs et icônes
// viennent de la SOURCE UNIQUE `CHRONO_ANCHORS` (@kaer/shared) — aucune en dur.
// Mémoïsée : replier/déplier une carte ne re-rend que celle-ci.
// Présentationnel, conforme MDR 2017/745 : horaires bruts, aucun seuil/jugement.

import { memo } from 'react'
import { View, Text, Pressable } from 'react-native'
import { colors } from '@theme'
import type { FormEntry } from '../../../../../lib/database'
import { RecordCardHeader } from './RecordCardHeader'
import { resolveChronoIcon } from '../ChronoMonth/chronoIcons'
import { buildDayMarkers } from './chronoFrise'
import { styles } from './styles'

// Graduation fixe de la frise (heures) — format horaire technique, pas de la prose.
const HOUR_TICKS = [0, 6, 12, 18, 24] as const

interface Props {
  entry: FormEntry
  expanded: boolean
  t: (key: string) => string
  onToggleExpand: (id: string) => void
  onEdit: (entry: FormEntry) => void
  onDelete: (entry: FormEntry) => void
}

function DayTimelineCardBase({ entry, expanded, t, onToggleExpand, onEdit, onDelete }: Props) {
  const markers = buildDayMarkers(entry.values)
  return (
    <Pressable
      style={styles.friseCard}
      testID={`record-${entry.id}`}
      onPress={() => onToggleExpand(entry.id)}
      accessibilityHint={t('common.details')}
    >
      <RecordCardHeader
        entry={entry}
        showCompletion={false}
        completeKeys={[]}
        toCompleteLabel=""
        t={t}
        onEdit={onEdit}
        onDelete={onDelete}
        prominent
        expanded={expanded}
      />
      <View style={styles.friseRailWrap} testID={`frise-${entry.id}`}>
        <View style={styles.friseRail} />
        {markers.map(m => {
          const Icon = resolveChronoIcon(m.iconName)
          return (
            <View
              key={m.key}
              style={[styles.friseMarker, { left: `${m.leftPct}%`, backgroundColor: m.color }]}
              testID={`frise-marker-${m.key}`}
            >
              <Icon size={10} color={colors.white} />
            </View>
          )
        })}
      </View>
      <View style={styles.friseScale}>
        {HOUR_TICKS.map(h => (
          <Text key={h} style={styles.friseScaleText}>{`${h}h`}</Text>
        ))}
      </View>
      {expanded ? (
        <View style={styles.friseDetail} testID={`frise-detail-${entry.id}`}>
          {markers.length === 0 ? (
            <Text style={styles.friseEmpty}>{t('modules.chrono_bio.day_no_anchors')}</Text>
          ) : (
            markers.map(m => {
              const Icon = resolveChronoIcon(m.iconName)
              return (
                <View key={m.key} style={styles.friseDetailRow} testID={`frise-detail-row-${m.key}`}>
                  <Icon size={16} color={m.color} />
                  <Text style={styles.friseDetailLabel}>{t(m.labelCode)}</Text>
                  <Text style={styles.friseDetailTime}>{m.time}</Text>
                </View>
              )
            })
          )}
        </View>
      ) : null}
    </Pressable>
  )
}

export const DayTimelineCard = memo(DayTimelineCardBase)
