// ─── ThemeRecallPanel — réassurance par thème (#118) ─────────────────────────
//
// Affiché à l'étape « Situation » de la saisie beck_columns, sous le champ
// Thème. Deux blocs, tous deux OPT-IN via la config (`theme_key`) :
//   1. des puces reprenant les thèmes que le patient a DÉJÀ employés (il tape
//      une puce pour réutiliser exactement la même étiquette) ;
//   2. un encart « réassurance » qui ré-affiche, BRUT et daté, le contenu de ses
//      colonnes passées portant le MÊME thème (preuves contre, réponse
//      rationnelle, résultat).
//
// Présentationnel pur, LECTURE SEULE : aucune action d'édition, et surtout
// aucun pré-remplissage de la nouvelle fiche — le patient relit son propre
// travail, il ne le recopie pas. Conformité MDR 2017/745 : valeurs brutes,
// aucune synthèse ni reformulation, aucune couleur de gravité (les teintes
// codent l'identité de colonne). La « similarité » est déclarée par le patient
// (même étiquette de thème) : le code filtre, il ne conclut pas.

import { memo, useMemo } from 'react'
import { View, Text } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { isFilledValue } from '@kaer/shared'
import { Chip } from '@ui/Chip'
import { Card } from '@ui/Card'
import { formatDateNumeric } from '../../../../../lib/dateUtils'
import {
  distinctThemes, matchEntriesByTheme, normalizeTheme,
  type ThemeEntry, type RecallField,
} from './themeRecall'
import { styles } from './styles'

/** Nombre max de fiches passées ré-affichées (le total est indiqué dans le titre). */
const MAX_RECALL = 3

export interface ThemeRecallPanelProps {
  /** Toutes les fiches du module (triées anti-chronologiquement). */
  entries: readonly ThemeEntry[]
  /** Clé du thème dans `values` (ex. `situation_theme`). */
  themeKey: string
  /** Thème saisi pour la fiche en cours. */
  currentTheme: string
  /** Fiche en cours d'édition (exclue du rappel), ou `null` en création. */
  editingId: string | null
  /** Code i18n du libellé de la rangée de puces. */
  chipsLabelCode: string
  /** Code i18n du titre de l'encart réassurance. */
  titleCode: string
  /** Code i18n de la consigne sous le titre (optionnel). */
  hintCode: string
  /** Champs ré-affichés (dérivés de la config des colonnes). */
  recallFields: readonly RecallField[]
  /** Couleur d'accent de l'étape (thème/mode ado). */
  accent: string
  t: (key: string) => string
  /** Réutilise une étiquette existante (remplit `values[themeKey]`). */
  onPickTheme: (theme: string) => void
}

function ThemeRecallPanelBase({
  entries, themeKey, currentTheme, editingId, chipsLabelCode,
  titleCode, hintCode, recallFields, accent, t, onPickTheme,
}: ThemeRecallPanelProps) {
  const themes = useMemo(() => distinctThemes(entries, themeKey), [entries, themeKey])
  const matches = useMemo(
    () => matchEntriesByTheme(entries, themeKey, currentTheme, editingId),
    [entries, themeKey, currentTheme, editingId],
  )
  const currentNorm = normalizeTheme(currentTheme)

  // Rien à proposer tant que le patient n'a jamais employé de thème.
  if (themes.length === 0) return null

  return (
    <View style={styles.recallPanel} testID="theme-recall">
      <View style={styles.recallChips}>
        {chipsLabelCode ? <Text style={styles.recallChipsLabel}>{t(chipsLabelCode)}</Text> : null}
        <View style={styles.suggestions}>
          {themes.map(theme => (
            <Chip
              key={theme}
              label={theme}
              size="sm"
              color={accent}
              selected={normalizeTheme(theme) === currentNorm}
              onPress={() => onPickTheme(theme)}
              testID={`theme-chip-${theme}`}
            />
          ))}
        </View>
      </View>

      {matches.length > 0 ? (
        <Card style={styles.recallCard} testID="theme-recall-matches">
          <View style={styles.recallHeader}>
            <MaterialCommunityIcons name="history" size={16} color={accent} />
            <Text style={styles.recallTitle}>{`${t(titleCode)} (${matches.length})`}</Text>
          </View>
          {hintCode ? <Text style={styles.recallHint}>{t(hintCode)}</Text> : null}
          {matches.slice(0, MAX_RECALL).map((entry, idx) => (
            <View
              key={entry.id}
              style={[styles.recallItem, idx > 0 && styles.recallItemDivider]}
              testID={`theme-recall-${entry.id}`}
            >
              <Text style={styles.recallDate}>{formatDateNumeric(entry.created_at)}</Text>
              {recallFields.map(field => {
                const value = entry.values[field.key]
                if (!isFilledValue(value)) return null
                const unit = typeof value === 'number' ? field.unit : ''
                return (
                  <View key={field.key} style={styles.recallField} testID={`theme-recall-${entry.id}-${field.key}`}>
                    <Text style={[styles.recallLabel, { color: field.color }]}>
                      {field.labelCode ? t(field.labelCode) : ''}
                    </Text>
                    <Text style={styles.recallValue}>{`${value}${unit}`}</Text>
                  </View>
                )
              })}
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  )
}

export const ThemeRecallPanel = memo(ThemeRecallPanelBase)
