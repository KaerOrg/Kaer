// ─── Layout `cards` — cartes accordéon (aperçu lecture seule) ────────────────
//
// Rend une liste de cartes pliables : chaque `section_id` = une carte avec
// `card_title`, `card_summary` optionnel et un corps déplié au clic. Une seule
// carte ouverte à la fois (state interne `expandedCard`).
// Conformité MDR 2017/745 : contenu éditorial, zéro interprétation.

import { useState, useCallback } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../../../../theme'
import type { ContentField } from '../../../../../services/moduleService'
import { useModuleT } from '../../../../../hooks/useModuleT'
import { FieldText } from '../../fields'
import { renderCardBodyFields } from './cardRendering'
import { styles } from './styles'

export interface CardsLayoutProps {
  /** Cartes regroupées par `section_id` (ordre d'insertion = ordre d'affichage). */
  sections: Map<string, ContentField[]>
}

export function CardsLayout({ sections }: CardsLayoutProps) {
  const t = useModuleT()
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const handleToggle = useCallback((id: string) => {
    setExpandedCard(prev => (prev === id ? null : id))
  }, [])

  return (
    <View style={styles.cardsBlock}>
      {[...sections.entries()].map(([sectionId, fields]) => {
        const titleField = fields.find(f => f.field_type === 'card_title')
        const summaryField = fields.find(f => f.field_type === 'card_summary')
        const bodyFields = fields.filter(
          f => f.field_type !== 'card_title' && f.field_type !== 'card_summary'
        )
        const isOpen = expandedCard === sectionId

        return (
          <View key={sectionId} style={styles.card}>
            <Pressable
              style={styles.cardHeader}
              onPress={() => handleToggle(sectionId)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={titleField ? t(titleField.text_code ?? '') : sectionId}
            >
              <View style={styles.cardMeta}>
                {titleField
                  ? <FieldText field={titleField} />
                  : <Text style={styles.cardFallbackTitle}>{sectionId}</Text>
                }
                {summaryField && <FieldText field={summaryField} />}
              </View>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
            {isOpen && bodyFields.length > 0 && (
              <View style={styles.cardBody}>
                {renderCardBodyFields(bodyFields)}
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}
