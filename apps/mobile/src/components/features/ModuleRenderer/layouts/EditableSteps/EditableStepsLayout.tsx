// ─── Layout `editable_steps` — plan éditable par sections (crisis_plan…) ─────
//
// Étapes pliables (une par `section_id`) ; chaque étape contient une liste
// d'items que le patient peut ajouter / modifier / supprimer, persistés en
// SQLite local via `plan_items`. Barre d'urgence fixe en bas (numéros tel:).
// La saisie des items est déléguée au composant partagé `EditableItemsList`.
// Conformité MDR 2017/745 : journal libre du patient, zéro interprétation.

import { useState, useCallback, useEffect, useMemo, type ComponentProps, type ComponentType } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '@theme'
import type { ContentField } from '@services/moduleService'
import { generateId } from '../../../../../lib/database'
import { getPlanItems, type PlanItem } from '@services/planItemService'
// Le plan de sécurité est un DOCUMENT PARTAGÉ : il s'écrit dans `safety_plan_items`,
// pas dans l'outbox montante, sinon ce que le praticien ajoute depuis le web ne
// descend jamais (PW-1). `editable_steps` n'est utilisé que par `crisis_plan` — voir
// le commentaire de `SECTION_WIDGETS` — donc ce service est le bon pour ce layout.
// La Balance décisionnelle, elle, garde `planItemService`.
import {
  refreshSafetyPlan,
  saveSafetyPlanItem,
  deleteSafetyPlanItem,
} from '@services/safetyPlanService'
import { pickContact } from '@services/contactsService'
import { useAuthStore } from '../../../../../store/authStore'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { EditableItemsList, EditableContactsList, CrisisEmergencyCalls, type EditableContact } from '../shared'
import { CrisisAnchorsWidget } from '../../fields/CrisisAnchorsWidget'
import { styles } from './styles'

// Widgets rendus pour les fields hors-section (après les étapes), dispatchés par
// `field_type`. Parité avec le LayoutDispatcher web (editable_steps).
// NB : `editable_steps` n'est aujourd'hui utilisé que par crisis_plan (il hardcode
// déjà les clés `modules.crisis_plan.*`). Si un second module l'adopte un jour, ce
// dispatch devra être généralisé (config-driven via field_props plutôt que cette map).
const SECTION_WIDGETS: Record<string, ComponentType> = {
  crisis_anchors_preview: CrisisAnchorsWidget,
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
  const patientId = useAuthStore(s => s.patient?.id)

  // Rafraîchissement à l'OUVERTURE du module, jamais dans le parcours de crise : le
  // praticien a pu compléter le plan depuis la consultation. La lecture affichée reste
  // celle du cache local, donc un échec réseau ne vide rien — il laisse le plan connu.
  useEffect(() => {
    let active = true
    const load = async () => {
      if (patientId != null) await refreshSafetyPlan(patientId)
      const data = await getPlanItems(moduleId)
      if (active) {
        setItems(data)
        setLoading(false)
      }
    }
    load().catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [moduleId, patientId])

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
      phone: null,
      contact_source: null,
      created_at: new Date().toISOString(),
    }
    if (patientId == null) return
    await saveSafetyPlanItem(patientId, newItem)
    setItems(prev => [...prev, newItem])
  }, [itemsBySection, moduleId, patientId])

  const handleEdit = useCallback(async (item: PlanItem, text: string) => {
    if (patientId == null) return
    await saveSafetyPlanItem(patientId, { id: item.id, section_id: item.section_id, text, sort_order: item.sort_order, phone: item.phone })
    setItems(prev => prev.map(i => (i.id === item.id ? { ...i, text } : i)))
  }, [patientId])

  // ── Contacts (étapes « contactables » : proches/pros, avec numéro appelable) ──

  const handleAddContact = useCallback(async (sectionId: string, name: string, phone: string, source: string | null) => {
    const existingItems = itemsBySection.get(sectionId) ?? []
    const newItem: PlanItem = {
      id: generateId(),
      module_id: moduleId,
      section_id: sectionId,
      text: name,
      sort_order: existingItems.length,
      weight: null,
      phone: phone !== '' ? phone : null,
      contact_source: source,
      created_at: new Date().toISOString(),
    }
    if (patientId == null) return
    await saveSafetyPlanItem(patientId, newItem)
    setItems(prev => [...prev, newItem])
  }, [itemsBySection, moduleId, patientId])

  const handleEditContact = useCallback(async (id: string, name: string, phone: string) => {
    const item = items.find(i => i.id === id)
    if (item == null || patientId == null) return
    const nextPhone = phone !== '' ? phone : null
    await saveSafetyPlanItem(patientId, { id: item.id, section_id: item.section_id, text: name, sort_order: item.sort_order, phone: nextPhone })
    setItems(prev => prev.map(i => (i.id === id ? { ...i, text: name, phone: nextPhone } : i)))
  }, [items, patientId])

  const handleDelete = useCallback((item: PlanItem) => {
    showConfirm({
      title: t('modules.crisis_plan.delete_item_title'),
      message: `"${item.text}"`,
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        if (patientId == null) return
        await deleteSafetyPlanItem(patientId, item.id)
        setItems(prev => prev.filter(i => i.id !== item.id))
      },
    })
  }, [t, showConfirm, patientId])

  const handleDeleteContact = useCallback((contact: EditableContact) => {
    const item = items.find(i => i.id === contact.id)
    if (item != null) handleDelete(item)
  }, [items, handleDelete])

  // Partition des fields hors-section : widgets de section (après les étapes, triés
  // par sort_order) et boutons d'appel (barre fixe en bas). Parité avec le web.
  const { emergencyFields, sectionWidgetFields } = useMemo(() => {
    const emergency: ContentField[] = []
    const sectionWidgets: ContentField[] = []
    for (const f of uiFields) {
      if (f.field_type === 'exercise_safety') emergency.push(f)
      else if (SECTION_WIDGETS[f.field_type] != null) sectionWidgets.push(f)
    }
    const bySortOrder = (a: ContentField, b: ContentField) => a.sort_order - b.sort_order
    emergency.sort(bySortOrder)
    sectionWidgets.sort(bySortOrder)
    return { emergencyFields: emergency, sectionWidgetFields: sectionWidgets }
  }, [uiFields])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  return (
    // KeyboardAvoidingView : sans lui, le clavier recouvre le champ d'ajout/édition d'un
    // item et la frappe ne s'inscrit pas dans la zone de saisie (issue #143). Même motif
    // que tous les autres layouts éditables (decision_grid, column_form, daily_checkin…) —
    // offset 88 = hauteur du header natif de ModuleContentScreen.
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {[...sections.entries()].map(([sectionId, fields], idx) => {
          const titleField = fields.find(f => f.field_type === 'step_title')
          const hintField = fields.find(f => f.field_type === 'step_hint')
          if (!titleField) return null

          const iconName = (titleField.props['icon'] ?? 'circle-outline') as ComponentProps<typeof MaterialCommunityIcons>['name']
          const bgColor = (titleField.props['bgColor'] as string | undefined) ?? '#F3F4F6'
          const iconColor = (titleField.props['color'] as string | undefined) ?? colors.primary
          const stepNumber = titleField.props['step_number'] ?? String(idx + 1)
          // Étape « contactable » (proches/pros) : items = contacts nom + numéro appelable.
          // Piloté par la config (`field_props.contactable`), jamais par un numéro d'étape en dur.
          const isContactable = titleField.props['contactable'] === 'true'
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
                  {isContactable ? (
                    <EditableContactsList
                      contacts={sectionItems.map(i => ({ id: i.id, name: i.text, phone: i.phone ?? '' }))}
                      accentColor={iconColor}
                      addLabel={t('modules.crisis_plan.add_contact')}
                      importLabel={t('modules.crisis_plan.import_contact')}
                      namePlaceholder={t('modules.crisis_plan.contact_name_placeholder')}
                      phonePlaceholder={t('modules.crisis_plan.contact_phone_placeholder')}
                      validateLabel={t('common.validate')}
                      cancelLabel={t('common.cancel')}
                      deleteLabel={t('common.delete')}
                      onAdd={(name, phone, source) => handleAddContact(sectionId, name, phone, source)}
                      onEdit={handleEditContact}
                      onDelete={handleDeleteContact}
                      onImport={pickContact}
                      testIdPrefix={`step-${stepNumber}`}
                    />
                  ) : (
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
                  )}
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
          <CrisisEmergencyCalls fields={emergencyFields} />
        </View>
      )}
    </KeyboardAvoidingView>
  )
}
