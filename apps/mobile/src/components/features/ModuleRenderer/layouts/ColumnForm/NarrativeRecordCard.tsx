// ─── NarrativeRecordCard — carte « récit avant → après » (refonte 1B #145) ───
//
// Variante OPT-IN de la carte liste `column_form`, activée par
// `list_card_variant = 'narrative'` (beck_columns). Présentationnel, mémoïsé :
// données et actions injectées par le layout parent.
//
// Conformité MDR 2017/745 : valeurs BRUTES uniquement. L'arc « avant → après »
// rapproche deux mesures sans jamais conclure : mêmes teintes pour les deux
// nombres et flèche neutre (`textMuted`) — AUCUN codage couleur de gravité ni
// flèche de tendance (le screenshot de handoff colorait « avant » en rouge et
// « après » en vert : écart volontaire, non conforme à la RÈGLE D'OR).

import { memo, useMemo, Fragment } from 'react'
import { View, Text } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import type { FormEntry } from '../../../../../lib/database'
import { RecordCardHeader } from './RecordCardHeader'
import type { NarrativeConfig } from './narrativeConfig'
import type { RecordColumnPart } from './RecordCard'
import { styles } from './styles'

interface Props {
  entry: FormEntry
  columnParts: RecordColumnPart[]
  config: NarrativeConfig
  expanded: boolean
  showCompletion: boolean
  completeKeys: string[]
  toCompleteLabel: string
  t: (key: string) => string
  onToggleExpand: (id: string) => void
  onEdit: (entry: FormEntry) => void
  onDelete: (entry: FormEntry) => void
}

function NarrativeRecordCardBase({
  entry, columnParts, config, expanded, showCompletion, completeKeys,
  toCompleteLabel, t, onToggleExpand, onDelete, onEdit,
}: Props) {
  // Accent par clé de champ (couleur de la colonne qui porte cette clé) — sert
  // au chevron du titre et aux labels colorés « je pensais » / « je me dis ».
  const keyAccent = useMemo(() => {
    const map = new Map<string, string>()
    for (const col of columnParts) {
      for (const child of [...col.textChildren, ...col.sliderChildren, ...col.timeChildren]) {
        const key = child.props['key']
        if (key) map.set(key, col.accent)
      }
    }
    return map
  }, [columnParts])

  const { arc } = config
  const titleVal = config.titleKey ? entry.values[config.titleKey] : null
  const strikeVal = config.strikeKey ? entry.values[config.strikeKey] : null
  const reframeVal = config.reframeKey ? entry.values[config.reframeKey] : null

  const beforeVal = arc ? entry.values[arc.beforeKey] : null
  const afterVal = arc ? entry.values[arc.afterKey] : null
  const hasBefore = typeof beforeVal === 'number'
  const hasAfter = typeof afterVal === 'number'
  const captionVal = arc?.captionKey ? entry.values[arc.captionKey] : null
  const caption = typeof captionVal === 'string' && captionVal ? captionVal : null

  // Clés déjà mises en avant (titre / arc / pensées) — exclues du dépliage pour
  // ne pas les répéter dans les lignes étiquetées « raisonnement complet ».
  const prominentKeys = useMemo(() => {
    const set = new Set<string>()
    for (const k of [config.titleKey, config.strikeKey, config.reframeKey, arc?.beforeKey, arc?.afterKey]) {
      if (k) set.add(k)
    }
    return set
  }, [config.titleKey, config.strikeKey, config.reframeKey, arc])

  const titleAccent = (config.titleKey && keyAccent.get(config.titleKey)) || colors.primary
  const strikeAccent = (config.strikeKey && keyAccent.get(config.strikeKey)) || colors.textMuted
  const reframeAccent = (config.reframeKey && keyAccent.get(config.reframeKey)) || colors.primary

  return (
    <View style={styles.recordCard} testID={`record-${entry.id}`}>
      <RecordCardHeader
        entry={entry}
        showCompletion={showCompletion}
        completeKeys={completeKeys}
        toCompleteLabel={toCompleteLabel}
        t={t}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {typeof titleVal === 'string' && titleVal ? (
        <View style={styles.narrativeTitleRow}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={titleAccent} />
          <Text style={styles.narrativeTitle} numberOfLines={2}>{titleVal}</Text>
        </View>
      ) : null}

      {arc && hasBefore && hasAfter ? (
        <View style={styles.arcCard} testID={`arc-${entry.id}`}>
          <View style={styles.arcSide}>
            <Text style={styles.arcLabel}>{t(arc.beforeLabelCode)}</Text>
            <Text style={styles.arcValue}>{beforeVal}{arc.unit}</Text>
            {caption ? <Text style={styles.arcCaption} numberOfLines={1}>{caption}</Text> : null}
          </View>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.textMuted} />
          <View style={styles.arcSide}>
            <Text style={styles.arcLabel}>{t(arc.afterLabelCode)}</Text>
            <Text style={styles.arcValue}>{afterVal}{arc.unit}</Text>
            {caption ? <Text style={styles.arcCaption} numberOfLines={1}>{caption}</Text> : null}
          </View>
        </View>
      ) : arc && hasBefore && !hasAfter ? (
        <View style={styles.arcTodo} testID={`arc-todo-${entry.id}`}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.textMuted} />
          <Text style={styles.arcTodoText}>{t(arc.todoLabelCode)}</Text>
        </View>
      ) : null}

      {typeof strikeVal === 'string' && strikeVal ? (
        <View style={styles.narrativeLine} testID={`narrative-strike-${entry.id}`}>
          <Text style={[styles.narrativeLabel, { color: strikeAccent }]}>{t(config.strikeLabelCode)}</Text>
          <Text style={styles.narrativeStrikeValue} numberOfLines={expanded ? undefined : 2}>{strikeVal}</Text>
        </View>
      ) : null}

      {typeof reframeVal === 'string' && reframeVal ? (
        <View style={styles.narrativeLine} testID={`narrative-reframe-${entry.id}`}>
          <Text style={[styles.narrativeLabel, { color: reframeAccent }]}>{t(config.reframeLabelCode)}</Text>
          <Text style={styles.narrativeReframeValue} numberOfLines={expanded ? undefined : 2}>{reframeVal}</Text>
        </View>
      ) : null}

      {expanded ? (
        <View style={styles.expandedBlock} testID={`expanded-${entry.id}`}>
          {columnParts.map(col => (
            <Fragment key={col.sectionId}>
              {[...col.textChildren, ...col.sliderChildren, ...col.timeChildren].map(child => {
                const key = child.props['key']
                if (!key || prominentKeys.has(key)) return null
                const value = entry.values[key]
                const filled = typeof value === 'number' || (typeof value === 'string' && value.length > 0)
                if (!filled) return null
                const unit = child.field_type === 'column_slider_field' ? (child.props['unit'] ?? '') : ''
                const label = col.headerLabelCode ? t(col.headerLabelCode) : ''
                return (
                  <View key={child.id} style={styles.labeledLine} testID={`reasoning-${key}`}>
                    <View style={[styles.labeledRule, { backgroundColor: col.accent }]} />
                    <View style={styles.labeledBody}>
                      {label ? <Text style={[styles.labeledLabel, { color: col.accent }]}>{label}</Text> : null}
                      <Text style={styles.labeledValue}>{value}{unit}</Text>
                    </View>
                  </View>
                )
              })}
            </Fragment>
          ))}
        </View>
      ) : null}

      <Button
        variant="ghost"
        label={t(config.expandLabelCode)}
        onPress={() => onToggleExpand(entry.id)}
        iconRight={
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        }
        testID={`expand-${entry.id}`}
      />
    </View>
  )
}

export const NarrativeRecordCard = memo(NarrativeRecordCardBase)
