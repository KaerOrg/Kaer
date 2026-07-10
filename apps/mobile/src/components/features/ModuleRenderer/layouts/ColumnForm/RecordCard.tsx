import { memo, Fragment } from 'react'
import { View, Text, Pressable } from 'react-native'
import type { ContentField } from '@services/moduleService'
import type { FormEntry } from '../../../../../lib/database'
import { RecordCardHeader } from './RecordCardHeader'
import { styles } from './styles'

// Colonne pré-découpée (une fois par module, pas par fiche) : ses enfants déjà
// répartis par type de widget. Évite de re-filtrer `col.children` pour chaque fiche.
export interface RecordColumnPart {
  sectionId: string
  accent: string
  /** Code i18n du titre de la colonne (label des lignes étiquetées du récit). */
  headerLabelCode: string | null
  textChildren: ContentField[]
  sliderChildren: ContentField[]
  timeChildren: ContentField[]
}

interface Props {
  entry: FormEntry
  columnParts: RecordColumnPart[]
  expanded: boolean
  showCompletion: boolean
  completeKeys: string[]
  toCompleteLabel: string
  t: (key: string) => string
  onToggleExpand: (id: string) => void
  onEdit: (entry: FormEntry) => void
  onDelete: (entry: FormEntry) => void
}

/**
 * Carte d'une fiche `column_form` en mode liste (mobile), mémoïsée : replier /
 * déplier une fiche ne re-rend que la fiche touchée, pas toute la liste.
 * Présentationnel — données et actions injectées par le layout parent.
 * Conforme MDR 2017/745 : valeurs brutes, aucun seuil ni label interprétatif.
 */
function RecordCardBase({
  entry, columnParts, expanded, showCompletion, completeKeys,
  toCompleteLabel, t, onToggleExpand, onEdit, onDelete,
}: Props) {
  return (
    <Pressable
      style={styles.recordCard}
      testID={`record-${entry.id}`}
      onPress={() => onToggleExpand(entry.id)}
      accessibilityHint={t('common.details')}
    >
      <RecordCardHeader
        entry={entry}
        showCompletion={showCompletion}
        completeKeys={completeKeys}
        toCompleteLabel={toCompleteLabel}
        t={t}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      {columnParts.map(col => (
        <Fragment key={col.sectionId}>
          {col.textChildren.map(child => {
            const key = child.props['key']
            if (!key) return null
            const value = entry.values[key]
            if (typeof value !== 'string' || !value) return null
            // Replié : annote avec le 1er slider de la colonne. Déplié :
            // texte intégral, les sliders ont leurs propres lignes.
            const slider = col.sliderChildren[0]
            const sliderKey = slider?.props['key']
            const sliderVal = sliderKey ? entry.values[sliderKey] : null
            return (
              <View key={child.id} style={styles.recordRow}>
                <View style={[styles.recordDot, { backgroundColor: col.accent }]} />
                <Text style={styles.recordText} numberOfLines={expanded ? undefined : 2}>
                  {value}
                  {!expanded && typeof sliderVal === 'number' ? (
                    <Text style={styles.recordIntensity}> ({sliderVal}%)</Text>
                  ) : null}
                </Text>
              </View>
            )
          })}
          {expanded
            ? col.sliderChildren.map(child => {
                const key = child.props['key']
                if (!key) return null
                const value = entry.values[key]
                if (typeof value !== 'number') return null
                const labelText = child.text_code ? t(child.text_code) : ''
                return (
                  <View key={child.id} style={styles.recordRow} testID={`record-slider-${key}`}>
                    <View style={[styles.recordDot, { backgroundColor: col.accent }]} />
                    <Text style={styles.recordText}>
                      {labelText ? <Text style={styles.recordIntensity}>{labelText} </Text> : null}
                      {value}
                    </Text>
                  </View>
                )
              })
            : null}
          {col.timeChildren.map(child => {
            const key = child.props['key']
            if (!key) return null
            const value = entry.values[key]
            if (typeof value !== 'string' || !value) return null
            const labelText = child.text_code ? t(child.text_code) : ''
            return (
              <View key={child.id} style={styles.recordRow} testID={`record-time-${key}`}>
                <View style={[styles.recordDot, { backgroundColor: col.accent }]} />
                <Text style={styles.recordText} numberOfLines={1}>
                  {labelText ? <Text style={styles.recordIntensity}>{labelText} </Text> : null}
                  {value}
                </Text>
              </View>
            )
          })}
        </Fragment>
      ))}
    </Pressable>
  )
}

export const RecordCard = memo(RecordCardBase)
