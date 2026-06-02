// ─── Layout `tree_selector` — sélecteur d'arbre guidé (emotion_wheel…) ──────
//
// Pattern « sélection hiérarchique guidée » : un arbre de noeuds modélisé
// via parent_field_id, navigation niveau par niveau, intensité brute
// optionnelle (1–N), notes libres optionnelles. 4 modes internes :
// history | selection | intensity | notes. Persistance dans la table SQLite
// générique `tree_selections`.
// Conformité MDR 2017/745 : aucun seuil interprétatif, juste affichage des
// déclarations brutes du patient.

import { useState, useCallback, useEffect, useMemo, type ComponentProps } from 'react'
import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../../../../theme'
import type { ContentField } from '../../../../../services/moduleService'
import {
  getAllTreeSelections, generateId,
  type TreeSelection, type TreeSelectionPathNode,
} from '../../../../../lib/database'
import { saveTreeSelection, deleteTreeSelection } from '../../../../../services/treeSelectionService'
import { formatDateTime } from '../../../../../lib/dateUtils'
import { useModuleT } from '../../../../../hooks/useModuleT'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { styles } from './styles'

interface TreeNode {
  id: string
  text_code: string | null
  color?: string
  icon?: string
  children: TreeNode[]
}

const DEFAULT_INTENSITY_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

function buildTreeNodes(fields: ContentField[]): TreeNode[] {
  const convert = (f: ContentField): TreeNode => ({
    id: f.id,
    text_code: f.text_code,
    color: f.props['color'],
    icon: f.props['icon'],
    children: (f.children ?? [])
      .filter(c => c.field_type === 'tree_node')
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(convert),
  })
  return fields
    .filter(f => f.field_type === 'tree_node' && f.parent_field_id == null)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(convert)
}

function resolvePathLabel(node: TreeSelectionPathNode, t: (key: string) => string): string {
  if (node.text_code) return t(node.text_code)
  if (node.label) return node.label
  return node.id
}

function intensityValuesFor(min: number, max: number): number[] {
  if (min === 1 && max === 10) return [...DEFAULT_INTENSITY_VALUES]
  const result: number[] = []
  for (let v = min; v <= max; v += 1) result.push(v)
  return result
}

export interface TreeSelectorLayoutProps {
  /** Fields du module (config + noeuds d'arbre). */
  fields: ContentField[]
  /** Note de bas de page MDR (sources scientifiques) — affichée en mode historique. */
  footer?: ContentField
  /** Identifiant du module — clé de persistance des `tree_selections`. */
  moduleId: string
}

export function TreeSelectorLayout({ fields, footer, moduleId }: TreeSelectorLayoutProps) {
  const t = useModuleT()
  const { showConfirm } = useConfirmDialog()
  // ── Résolution des champs DB-driven
  const configField = fields.find(f => f.field_type === 'tree_selector_config')
  const lbl = (key: string): string => {
    const code = configField?.props[key]
    return code ? t(code) : ''
  }
  const enableIntensity = (configField?.props['enable_intensity'] ?? '0') === '1'
  const enableNotes = (configField?.props['enable_notes'] ?? '0') === '1'
  const intensityMin = parseInt(configField?.props['intensity_min'] ?? '1', 10)
  const intensityMax = parseInt(configField?.props['intensity_max'] ?? '10', 10)
  const intensityValues = useMemo(
    () => intensityValuesFor(intensityMin, intensityMax),
    [intensityMin, intensityMax]
  )

  const nodes = useMemo(() => buildTreeNodes(fields), [fields])

  // ── State
  const [mode, setMode] = useState<'history' | 'selection' | 'intensity' | 'notes'>('history')
  const [path, setPath] = useState<TreeNode[]>([])
  const [intensity, setIntensity] = useState<number>(Math.round((intensityMin + intensityMax) / 2))
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState<TreeSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadEntries = useCallback(async () => {
    const data = await getAllTreeSelections(moduleId)
    setEntries(data)
    setLoading(false)
  }, [moduleId])

  useEffect(() => { loadEntries().catch(() => setLoading(false)) }, [loadEntries])

  // ── Couleur courante : couleur du noeud le plus profond ayant une couleur
  const accentColor = useMemo(() => {
    for (let i = path.length - 1; i >= 0; i -= 1) {
      if (path[i].color) return path[i].color!
    }
    return colors.primary
  }, [path])

  // ── Noeuds visibles à l'étape courante : enfants du dernier sélectionné, ou racine
  const currentNodes = useMemo(() => {
    if (path.length === 0) return nodes
    return path[path.length - 1].children
  }, [nodes, path])

  // ── Titres d'étape par niveau (le titre du niveau 2 est le label parent)
  const level = path.length + 1 // 1 quand path vide
  const stepTitle = useMemo(() => {
    if (level === 2 && path.length >= 1) {
      return path[0].text_code ? t(path[0].text_code) : ''
    }
    return lbl(`step_${level}_title`)
  }, [level, path, lbl, t])
  const stepHint = lbl(`step_${level}_hint`)

  // ── Navigation
  const handleStartNew = useCallback(() => {
    setPath([])
    setIntensity(Math.round((intensityMin + intensityMax) / 2))
    setNotes('')
    setMode('selection')
  }, [intensityMin, intensityMax])

  const handleSelectNode = useCallback((node: TreeNode) => {
    const newPath = [...path, node]
    if (node.children.length > 0) {
      setPath(newPath)
      return
    }
    // Feuille atteinte
    setPath(newPath)
    if (enableIntensity) {
      setMode('intensity')
    } else if (enableNotes) {
      setMode('notes')
    } else {
      // Auto-save quand pas d'étapes supplémentaires
      void persistEntry(newPath, null, '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enableIntensity, enableNotes])

  const handleBack = useCallback(() => {
    if (mode === 'notes' && enableIntensity) { setMode('intensity'); return }
    if (mode === 'notes' || mode === 'intensity') { setMode('selection'); return }
    if (path.length > 0) {
      setPath(prev => prev.slice(0, -1))
      return
    }
    setMode('history')
  }, [mode, path, enableIntensity])

  const handleCancel = useCallback(() => {
    setPath([])
    setMode('history')
  }, [])

  const persistEntry = useCallback(async (
    finalPath: TreeNode[],
    finalIntensity: number | null,
    finalNotes: string,
  ) => {
    if (finalPath.length === 0) return
    setSaving(true)
    try {
      const leaf = finalPath[finalPath.length - 1]
      await saveTreeSelection({
        id: generateId(),
        module_id: moduleId,
        selected_id: leaf.id,
        selected_label: leaf.text_code,
        path: finalPath.map(n => ({
          id: n.id,
          text_code: n.text_code ?? undefined,
          color: n.color,
          icon: n.icon,
        })),
        intensity: finalIntensity,
        notes: finalNotes.trim() || null,
      })
      await loadEntries()
      setPath([])
      setIntensity(Math.round((intensityMin + intensityMax) / 2))
      setNotes('')
      setMode('history')
    } finally {
      setSaving(false)
    }
  }, [moduleId, loadEntries, intensityMin, intensityMax])

  const handleConfirmIntensity = useCallback(() => {
    if (enableNotes) {
      setMode('notes')
      return
    }
    void persistEntry(path, intensity, '')
  }, [enableNotes, persistEntry, path, intensity])

  const handleSaveFinal = useCallback(() => {
    void persistEntry(path, enableIntensity ? intensity : null, notes)
  }, [persistEntry, path, enableIntensity, intensity, notes])

  const handleDelete = useCallback((entry: TreeSelection) => {
    showConfirm({
      title: lbl('delete_title') || t('common.delete'),
      message: t('common.irreversible'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deleteTreeSelection(entry.id)
        setEntries(prev => prev.filter(e => e.id !== entry.id))
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, showConfirm])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  }

  // ── Mode historique ────────────────────────────────────────────────────────
  if (mode === 'history') {
    const introText = lbl('intro')
    const newBtnLabel = lbl('new_btn') || t('common.add')
    const historyLabel = lbl('history_label')
    const emptyTitle = lbl('empty_title')
    const emptyText = lbl('empty_text')

    return (
      <View style={styles.container}>
        <Pressable
          style={styles.startBtn}
          onPress={handleStartNew}
          accessibilityRole="button"
          accessibilityLabel={newBtnLabel}
          testID="start-new-button"
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.white} />
          <Text style={styles.startBtnText}>{newBtnLabel}</Text>
        </Pressable>

        <ScrollView contentContainerStyle={styles.historyContent}>
          {introText ? (
            <View style={styles.introCard} testID="intro-card">
              <MaterialCommunityIcons name="palette" size={22} color={colors.primary} />
              <Text style={styles.introText}>{introText}</Text>
            </View>
          ) : null}

          {entries.length === 0 ? (
            <View style={styles.empty} testID="list-empty">
              <MaterialCommunityIcons name="palette-outline" size={52} color={colors.border} />
              {emptyTitle ? <Text style={styles.emptyTitle}>{emptyTitle}</Text> : null}
              {emptyText ? <Text style={styles.emptyText}>{emptyText}</Text> : null}
            </View>
          ) : (
            <View style={styles.section}>
              {historyLabel ? (
                <Text style={styles.sectionLabel}>{historyLabel} ({entries.length})</Text>
              ) : null}
              {entries.map(entry => {
                const rootNode = entry.path[0]
                const cardColor = rootNode?.color ?? colors.primary
                const cardIcon = (rootNode?.icon ?? 'palette-outline') as ComponentProps<typeof MaterialCommunityIcons>['name']
                const labels = entry.path.map(n => resolvePathLabel(n, t)).filter(Boolean)
                return (
                  <View
                    key={entry.id}
                    style={[styles.entryCard, { borderLeftColor: cardColor }]}
                    testID={`entry-card-${entry.id}`}
                  >
                    <View style={styles.entryHeader}>
                      <View style={[styles.entryIcon, { backgroundColor: cardColor + '1A' }]}>
                        <MaterialCommunityIcons name={cardIcon} size={20} color={cardColor} />
                      </View>
                      <View style={styles.entryLabels}>
                        {labels[0] ? (
                          <Text style={[styles.entryPrimary, { color: cardColor }]}>{labels[0]}</Text>
                        ) : null}
                        {labels.length > 1 ? (
                          <Text style={styles.entrySecondary}>
                            {labels.slice(1).join(' · ')}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.entryRight}>
                        {entry.intensity != null ? (
                          <View style={[styles.intensityBadge, { backgroundColor: cardColor + '1A' }]}>
                            <Text style={[styles.intensityText, { color: cardColor }]}>
                              {entry.intensity}/{intensityMax}
                            </Text>
                          </View>
                        ) : null}
                        <Pressable
                          onPress={() => handleDelete(entry)}
                          accessibilityRole="button"
                          accessibilityLabel={t('common.delete')}
                          hitSlop={8}
                          testID={`delete-${entry.id}`}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                    {entry.notes ? (
                      <Text style={styles.entryNotes} numberOfLines={2}>{entry.notes}</Text>
                    ) : null}
                    <Text style={styles.entryDate}>{formatDateTime(entry.created_at)}</Text>
                  </View>
                )
              })}
            </View>
          )}

          {footer != null && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
              <Text style={styles.footerText}>{t(footer.text_code ?? '')}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    )
  }

  // ── Mode sélection (navigation dans l'arbre) ───────────────────────────────
  if (mode === 'selection') {
    const breadcrumb = path.map(n => (n.text_code ? t(n.text_code) : '')).filter(Boolean).join(' › ')
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            testID="back-button"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {
                width: `${(level / Math.max(level, 3)) * 100}%`,
                backgroundColor: accentColor,
              }]} />
            </View>
            {breadcrumb ? (
              <Text style={styles.progressLabel} numberOfLines={1}>{breadcrumb}</Text>
            ) : null}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.selectionContent}>
          {stepTitle ? <Text style={styles.stepTitle}>{stepTitle}</Text> : null}
          {stepHint ? <Text style={styles.stepHint}>{stepHint}</Text> : null}

          {level === 1 ? (
            <View style={styles.gridContainer} testID="level-1-grid">
              {currentNodes.map(node => {
                const nodeColor = node.color ?? colors.primary
                const nodeIcon = (node.icon ?? 'circle-outline') as ComponentProps<typeof MaterialCommunityIcons>['name']
                const label = node.text_code ? t(node.text_code) : ''
                return (
                  <Pressable
                    key={node.id}
                    style={[styles.primaryCard, { borderColor: nodeColor }]}
                    onPress={() => handleSelectNode(node)}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    testID={`node-${node.id}`}
                  >
                    <View style={[styles.primaryIconCircle, { backgroundColor: nodeColor + '1A' }]}>
                      <MaterialCommunityIcons name={nodeIcon} size={28} color={nodeColor} />
                    </View>
                    <Text style={[styles.primaryLabel, { color: nodeColor }]}>{label}</Text>
                  </Pressable>
                )
              })}
            </View>
          ) : (
            <View style={styles.listContainer} testID={`level-${level}-list`}>
              {currentNodes.map(node => {
                const nodeColor = node.color ?? accentColor
                const label = node.text_code ? t(node.text_code) : ''
                return (
                  <Pressable
                    key={node.id}
                    style={[styles.optionCard, { borderLeftColor: nodeColor }]}
                    onPress={() => handleSelectNode(node)}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    testID={`node-${node.id}`}
                  >
                    <Text style={[styles.optionLabel, { color: nodeColor }]}>{label}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                  </Pressable>
                )
              })}
            </View>
          )}
        </ScrollView>
      </View>
    )
  }

  // ── Mode intensité ─────────────────────────────────────────────────────────
  if (mode === 'intensity') {
    const intensityTitle = lbl('intensity_title')
    const intensityHint = lbl('intensity_hint')
    const continueLabel = lbl('continue_btn') || t('common.continue')
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            testID="back-button"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.selectionContent}>
          {intensityTitle ? <Text style={styles.stepTitle}>{intensityTitle}</Text> : null}
          {intensityHint ? <Text style={styles.stepHint}>{intensityHint}</Text> : null}

          <View style={styles.intensityCard} testID="intensity-card">
            <View style={[styles.intensityDisplay, { backgroundColor: accentColor + '1A' }]}>
              <Text style={[styles.intensityValue, { color: accentColor }]} testID="intensity-value">
                {intensity}
              </Text>
              <Text style={styles.intensityMax}>/{intensityMax}</Text>
            </View>
            <View style={styles.intensityBtns}>
              {intensityValues.map(v => {
                const isActive = intensity === v
                return (
                  <Pressable
                    key={v}
                    style={[
                      styles.intensityBtn,
                      isActive && { backgroundColor: accentColor, borderColor: accentColor },
                    ]}
                    onPress={() => setIntensity(v)}
                    accessibilityRole="button"
                    accessibilityLabel={String(v)}
                    testID={`intensity-btn-${v}`}
                  >
                    <Text style={[
                      styles.intensityBtnText,
                      isActive && styles.intensityBtnTextActive,
                    ]}>{v}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <Pressable
            style={[styles.continueBtn, { backgroundColor: accentColor }]}
            onPress={handleConfirmIntensity}
            accessibilityRole="button"
            accessibilityLabel={continueLabel}
            testID="continue-intensity"
          >
            <Text style={styles.continueBtnText}>{continueLabel}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
          </Pressable>
        </ScrollView>
      </View>
    )
  }

  // ── Mode notes ─────────────────────────────────────────────────────────────
  const notesTitle = lbl('notes_title')
  const notesHint = lbl('notes_hint')
  const notesPlaceholder = lbl('notes_placeholder')
  const saveLabel = lbl('save_btn') || t('common.save')
  const summary = path.map(n => (n.text_code ? t(n.text_code) : '')).filter(Boolean).join(' — ')

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          testID="back-button"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.selectionContent} keyboardShouldPersistTaps="handled">
        {notesTitle ? <Text style={styles.stepTitle}>{notesTitle}</Text> : null}
        {notesHint ? <Text style={styles.stepHint}>{notesHint}</Text> : null}

        {summary ? (
          <View style={[styles.summaryCard, { borderLeftColor: accentColor }]} testID="summary-card">
            <Text style={[styles.summaryPrimary, { color: accentColor }]}>{summary}</Text>
            {enableIntensity ? (
              <Text style={styles.summaryMeta}>{intensity}/{intensityMax}</Text>
            ) : null}
          </View>
        ) : null}

        <TextInput
          style={styles.notesInput}
          placeholder={notesPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          accessibilityLabel={notesPlaceholder}
          testID="notes-input"
        />

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.cancelBtn}
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            testID="cancel-entry"
          >
            <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable
            style={[styles.saveBtn, { backgroundColor: accentColor }, saving && styles.btnDisabled]}
            onPress={handleSaveFinal}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={saveLabel}
            testID="save-entry"
          >
            <Text style={styles.saveBtnText}>{saving ? '…' : saveLabel}</Text>
            {!saving && <MaterialCommunityIcons name="check" size={20} color={colors.white} />}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
