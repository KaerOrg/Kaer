// ─── Layout `safety_plan` — vue de consultation « Je suis en crise » ────────
//
// Entrée par défaut du plan de crise, pensée pour un moment de crise : numéros
// d'urgence en tête (force majeure), puis le plan de sécurité en LECTURE SEULE
// (les 6 étapes remplies + « Mes raisons de tenir »). La roue crantée en haut à
// droite ouvre l'écran de paramétrage (layout `editable_steps`) pour éditer le plan.
// Conformité MDR 2017/745 : affichage brut du plan du patient + raccourcis d'appel,
// zéro interprétation.

import { useState, useEffect, useMemo, useCallback, type ComponentProps } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import { Button } from '@ui/Button'
import type { ContentField } from '@services/moduleService'
import { getPlanItems, type PlanItem } from '@services/planItemService'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import type { AppStackParamList } from '../../../../../navigation/AppStack'
import { CrisisEmergencyCalls } from '../shared'
import { CrisisAnchorsWidget } from '../../fields/CrisisAnchorsWidget'
import { styles } from './styles'

type Nav = NativeStackNavigationProp<AppStackParamList>

export interface SafetyPlanLayoutProps {
  /** Étapes regroupées par `section_id`. */
  sections: Map<string, ContentField[]>
  /** Fields hors section (boutons d'urgence, ancres). */
  uiFields: ContentField[]
  /** Identifiant du module — clé de persistance des `plan_items`. */
  moduleId: string
}

export function SafetyPlanLayout({ sections, uiFields, moduleId }: SafetyPlanLayoutProps) {
  const t = useModuleTranslation()
  // Clés i18n dérivées du module courant : le layout `safety_plan` reste un motif
  // générique réutilisable (config-first — jamais de clé de module en dur).
  const lbl = useCallback((key: string) => t(`modules.${moduleId}.${key}`), [t, moduleId])
  const navigation = useNavigation<Nav>()
  const [items, setItems] = useState<PlanItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getPlanItems(moduleId)
      .then(data => { if (active) setItems(data) })
      .catch(() => { /* la vue reste sur les étapes vides + numéros d'urgence */ })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [moduleId])

  const itemsBySection = useMemo(() => {
    const map = new Map<string, PlanItem[]>()
    for (const item of items) {
      const list = map.get(item.section_id) ?? []
      list.push(item)
      map.set(item.section_id, list)
    }
    return map
  }, [items])

  // La roue crantée ouvre le même module en forçant le layout d'édition `editable_steps`.
  const openConfig = useCallback(() => {
    navigation.push('ModuleContent', { moduleType: moduleId, previewKindOverride: 'editable_steps' })
  }, [navigation, moduleId])

  const hasAnchors = useMemo(
    () => uiFields.some(f => f.field_type === 'crisis_anchors_preview'),
    [uiFields],
  )

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="lifebuoy" size={22} color={colors.danger} />
            <Text style={styles.headerTitle}>{lbl('consultation_title')}</Text>
          </View>
          <Button
            variant="ghost"
            iconLeft={<MaterialCommunityIcons name="cog-outline" size={22} color={colors.textMuted} />}
            onPress={openConfig}
            accessibilityLabel={lbl('configure_plan')}
            testID="safety-plan-configure"
          />
        </View>

        <CrisisEmergencyCalls fields={uiFields} />

        {[...sections.entries()].map(([sectionId, fields], idx) => {
          const titleField = fields.find(f => f.field_type === 'step_title')
          const hintField = fields.find(f => f.field_type === 'step_hint')
          if (!titleField) return null

          const iconName = (titleField.props['icon'] ?? 'circle-outline') as ComponentProps<typeof MaterialCommunityIcons>['name']
          const bgColor = (titleField.props['bgColor'] as string | undefined) ?? '#F3F4F6'
          const iconColor = (titleField.props['color'] as string | undefined) ?? colors.primary
          const stepNumber = titleField.props['step_number'] ?? String(idx + 1)
          const sectionItems = itemsBySection.get(sectionId) ?? []

          return (
            <View key={sectionId} style={styles.card}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconBg, { backgroundColor: bgColor }]}>
                  <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepNumber}>{lbl('step_label').replace('{{number}}', String(stepNumber))}</Text>
                  <Text style={styles.stepTitle}>{t(titleField.text_code ?? '')}</Text>
                </View>
              </View>
              <View style={styles.stepContent}>
                {hintField != null ? (
                  <Text style={styles.stepHint}>{t(hintField.text_code ?? '')}</Text>
                ) : null}
                {sectionItems.length > 0 ? (
                  sectionItems.map(item => (
                    <View key={item.id} style={styles.item}>
                      <MaterialCommunityIcons name="circle-small" size={20} color={iconColor} />
                      <Text style={styles.itemText}>{item.text}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyStep}>{lbl('step_empty')}</Text>
                )}
              </View>
            </View>
          )
        })}

        {hasAnchors ? <CrisisAnchorsWidget /> : null}
      </ScrollView>
    </View>
  )
}
