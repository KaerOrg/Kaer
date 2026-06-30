// ─── Layout `editable_steps` — plan éditable par sections (crisis_plan…) ─────
//
// Étapes pliables (une par `section_id`) ; chaque étape contient une liste
// d'items que le patient peut ajouter / modifier / supprimer, persistés en
// SQLite local via `plan_items`. Barre d'urgence fixe en bas (numéros tel:).
// La saisie des items est déléguée au composant partagé `EditableItemsList`.
// Conformité MDR 2017/745 : journal libre du patient, zéro interprétation.

import { useState, useCallback, useEffect, useMemo, type ComponentProps, type ComponentType } from 'react'
import { View, Text, Pressable, ScrollView, Linking, ActivityIndicator } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import type { ContentField } from '@services/moduleService'
import { getAllPlanItemsForModule, generateId, type PlanItem } from '../../../../../lib/database'
import { savePlanItem, deletePlanItem } from '@services/planItemService'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { EditableItemsList } from '../shared'
import { CrisisUrgencyEntry } from '../../fields/CrisisUrgencyEntry'
import { CrisisAnchorsWidget } from '../../fields/CrisisAnchorsWidget'
import { CrisisCopingCardsWidget } from '../../fields/CrisisCopingCardsWidget'
import { CrisisCommitmentWidget } from '../../fields/CrisisCommitmentWidget'
import { styles } from './styles'

// Widgets rendus pour les fields hors-section (après les étapes), dispatchés par
// `field_type`. Parité avec le LayoutDispatcher web (editable_steps).
// NB : `editable_steps` n'est aujourd'hui utilisé que par crisis_plan (il hardcode
// déjà les clés `modules.crisis_plan.*`). Si un second module l'adopte un jour, ce
// dispatch devra être généralisé (config-driven via field_props plutôt que cette map).
const SECTION_WIDGETS: Record<string, ComponentType> = {
  crisis_anchors_preview: CrisisAnchorsWidget,
  crisis_coping_cards_preview: CrisisCopingCardsWidget,
  crisis_commitment_preview: CrisisCommitmentWidget,
}

export interface EditableStepsLayoutProps {
  /** Étapes regroupées par `section_id`. */
  sections: Map<string, ContentField[]>
  /** Fields hors section (boutons d'urgence). */
  uiFields: ContentField[]
  /** Identifiant du module — clé de persistance des `plan_items`. */
  moduleId: string
}

export function EditableStepsLayout({ sections, uiFields, moduleId }: EditableStepsLayoutProps) {
  const t = useModuleTranslation()
  const { showConfirm } = useConfirmDialog()
  const [items, setItems] = useState<PlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    getAllPlanItemsForModule(moduleId)
      .then(data => {
        setItems(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
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

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }, [])

  const handleAdd = useCallback(async (sectionId: string, text: string) => {
    const existingItems = itemsBySection.get(sectionId) ?? []
    const newItem: PlanItem = {
      id: generateId(),
      module_id: moduleId,
      section_id: sectionId,
      text,
      sort_order: existingItems.length,
      weight: null,
      created_at: new Date().toISOString(),
    }
    await savePlanItem(newItem)
    setItems(prev => [...prev, newItem])
  }, [itemsBySection, moduleId])

  const handleEdit = useCallback(async (item: PlanItem, text: string) => {
    await savePlanItem({ id: item.id, module_id: item.module_id, section_id: item.section_id, text, sort_order: item.sort_order, weight: item.weight })
    setItems(prev => prev.map(i => (i.id === item.id ? { ...i, text } : i)))
  }, [])

  const handleDelete = useCallback((item: PlanItem) => {
    showConfirm({
      title: t('modules.crisis_plan.delete_item_title'),
      message: `"${item.text}"`,
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deletePlanItem(item.id)
        setItems(prev => prev.filter(i => i.id !== item.id))
      },
    })
  }, [t, showConfirm])

  // Partition unique des fields hors-section : bandeau d'entrée urgence (en tête),
  // widgets de section (après les étapes, triés par sort_order) et boutons d'appel
  // (barre fixe en bas). Parité avec le LayoutDispatcher web.
  const { emergencyFields, hasUrgencyEntry, sectionWidgetFields } = useMemo(() => {
    const emergency: ContentField[] = []
    const sectionWidgets: ContentField[] = []
    let urgency = false
    for (const f of uiFields) {
      if (f.field_type === 'exercise_safety') emergency.push(f)
      else if (f.field_type === 'crisis_urgency_entry') urgency = true
      else if (SECTION_WIDGETS[f.field_type] != null) sectionWidgets.push(f)
    }
    const bySortOrder = (a: ContentField, b: ContentField) => a.sort_order - b.sort_order
    emergency.sort(bySortOrder)
    sectionWidgets.sort(bySortOrder)
    return { emergencyFields: emergency, hasUrgencyEntry: urgency, sectionWidgetFields: sectionWidgets }
  }, [uiFields])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {hasUrgencyEntry && <CrisisUrgencyEntry />}
        {[...sections.entries()].map(([sectionId, fields], idx) => {
          const titleField = fields.find(f => f.field_type === 'step_title')
          const hintField = fields.find(f => f.field_type === 'step_hint')
          if (!titleField) return null

          const iconName = (titleField.props['icon'] ?? 'circle-outline') as ComponentProps<typeof MaterialCommunityIcons>['name']
          const bgColor = (titleField.props['bgColor'] as string | undefined) ?? '#F3F4F6'
          const iconColor = (titleField.props['color'] as string | undefined) ?? colors.primary
          const stepNumber = titleField.props['step_number'] ?? String(idx + 1)
          const isExpanded = expandedSections.has(sectionId)
          const sectionItems = itemsBySection.get(sectionId) ?? []

          return (
            <View key={sectionId} style={styles.card}>
              <Pressable
                style={styles.stepHeader}
                onPress={() => toggleSection(sectionId)}
                testID={`step-header-${stepNumber}`}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
              >
                <View style={[styles.stepIconBg, { backgroundColor: bgColor }]}>
                  <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepNumber}>{t('modules.crisis_plan.step_label').replace('{{number}}', String(stepNumber))}</Text>
                  <Text style={styles.stepTitle}>{t(titleField.text_code ?? '')}</Text>
                </View>
                <View style={styles.stepRight}>
                  {sectionItems.length > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{sectionItems.length}</Text>
                    </View>
                  )}
                  <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
                </View>
              </Pressable>

              {isExpanded && (
                <View style={styles.stepContent}>
                  {hintField != null && (
                    <Text style={styles.stepHint}>{t(hintField.text_code ?? '')}</Text>
                  )}
                  <EditableItemsList
                    items={sectionItems}
                    accentColor={iconColor}
                    weightConfig={null}
                    addLabel={t('modules.crisis_plan.add_item')}
                    placeholder={t('modules.crisis_plan.item_placeholder')}
                    onAdd={(text) => handleAdd(sectionId, text)}
                    onEdit={(item, text) => handleEdit(item, text)}
                    onDelete={handleDelete}
                    testIdPrefix={`step-${stepNumber}`}
                  />
                </View>
              )}
            </View>
          )
        })}

        {sectionWidgetFields.map(f => {
          const Widget = SECTION_WIDGETS[f.field_type]
          return <Widget key={f.id} />
        })}
      </ScrollView>

      {emergencyFields.length > 0 && (
        <View style={styles.emergencyBar}>
          <View style={styles.emergencyRow}>
            {emergencyFields.map(f => {
              const phone = f.props['phone'] ?? ''
              const btnColor = (f.props['bgColor'] as string | undefined) ?? '#DC2626'
              return (
                <Pressable
                  key={f.id}
                  style={[styles.emergencyBtn, { backgroundColor: btnColor }]}
                  onPress={() => { if (phone) void Linking.openURL(`tel:${phone}`) }}
                  testID={`emergency-${phone}`}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="phone" size={20} color="#fff" />
                  <View>
                    <Text style={styles.emergencyNumber}>{t(f.text_code ?? '')}</Text>
                    {f.props['label_code'] != null && (
                      <Text style={styles.emergencyLabel}>{t(f.props['label_code'] as string)}</Text>
                    )}
                  </View>
                </Pressable>
              )
            })}
          </View>
        </View>
      )}
    </View>
  )
}
