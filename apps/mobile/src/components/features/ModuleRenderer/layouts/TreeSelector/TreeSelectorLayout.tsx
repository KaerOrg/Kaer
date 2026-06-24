// ─── Layout `tree_selector` — sélecteur d'arbre guidé (emotion_wheel…) ──────
//
// Pattern « sélection hiérarchique guidée » : un arbre de noeuds modélisé via
// parent_field_id, navigation niveau par niveau. Étapes optionnelles pilotées
// par la config : intensité brute (1–N), tag de contexte (chips), notes libres.
// Profondeur libre : si `enable_early_validate`, le patient peut valider à
// n'importe quel niveau sans descendre jusqu'à une feuille.
//
// 5 modes internes : history | selection | intensity | context | notes.
// Persistance dans la table SQLite générique `tree_selections`.
// Conformité MDR 2017/745 : aucun seuil interprétatif, aucune couleur de
// gravité — les couleurs/emojis codent l'identité de famille. Affichage brut
// des déclarations du patient.

import { useState, useCallback, useEffect, useMemo, type ComponentProps } from 'react'
import {
  View, Text, Pressable, ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Ionicons } from '@expo/vector-icons'
import { collectIndexed } from '@kaer/shared'
import { colors } from '@theme'
import type { ContentField } from '../../../../../services/moduleService'
import {
  getAllTreeSelections, generateId,
  type TreeSelection, type TreeSelectionPathNode,
} from '../../../../../lib/database'
import { saveTreeSelection, deleteTreeSelection } from '../../../../../services/treeSelectionService'
import { formatDateTime } from '../../../../../lib/dateUtils'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { Chip } from '../../../../ui/Chip/Chip'
import { TreeSelectorHeader } from './TreeSelectorHeader'
import { styles } from './styles'

type McIcon = ComponentProps<typeof MaterialCommunityIcons>['name']

interface TreeNode {
  id: string
  text_code: string | null
  color?: string
  icon?: string
  emoji?: string
  children: TreeNode[]
}

interface ContextOption {
  /** Clé i18n du libellé (stockée telle quelle dans l'entrée). */
  code: string
  icon: McIcon
}

type Mode = 'history' | 'selection' | 'intensity' | 'context' | 'notes'

const DEFAULT_INTENSITY_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

function buildTreeNodes(fields: ContentField[]): TreeNode[] {
  const convert = (f: ContentField): TreeNode => ({
    id: f.id,
    text_code: f.text_code,
    color: f.props['color'],
    icon: f.props['icon'],
    emoji: f.props['emoji'],
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
  const t = useModuleTranslation()
  const { showConfirm } = useConfirmDialog()

  // ── Config DB-driven
  const configField = fields.find(f => f.field_type === 'tree_selector_config')
  const props = useMemo(() => configField?.props ?? {}, [configField])
  const lbl = useCallback((key: string): string => {
    const code = props[key]
    return code ? t(code) : ''
  }, [props, t])

  const enableIntensity = (props['enable_intensity'] ?? '0') === '1'
  const enableNotes = (props['enable_notes'] ?? '0') === '1'
  const enableContext = (props['enable_context'] ?? '0') === '1'
  const enableEarlyValidate = (props['enable_early_validate'] ?? '0') === '1'
  const intensityMin = parseInt(props['intensity_min'] ?? '1', 10)
  const intensityMax = parseInt(props['intensity_max'] ?? '10', 10)
  const intensityValues = useMemo(
    () => intensityValuesFor(intensityMin, intensityMax),
    [intensityMin, intensityMax]
  )
  const contextOptions = useMemo<ContextOption[]>(() => {
    const codes = collectIndexed(props, 'context_opt')
    const icons = collectIndexed(props, 'context_icon')
    return codes.map((code, i) => ({ code, icon: (icons[i] ?? 'tag-outline') as McIcon }))
  }, [props])

  const nodes = useMemo(() => buildTreeNodes(fields), [fields])
  const midIntensity = Math.round((intensityMin + intensityMax) / 2)

  // ── State
  const [mode, setMode] = useState<Mode>('history')
  const [path, setPath] = useState<TreeNode[]>([])
  const [intensity, setIntensity] = useState<number>(midIntensity)
  const [context, setContext] = useState<string[]>([])
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

  const currentNodes = useMemo(() => {
    if (path.length === 0) return nodes
    return path[path.length - 1].children
  }, [nodes, path])

  const level = path.length + 1 // 1 quand path vide
  const stepTitle = useMemo(() => {
    if (level === 2 && path.length >= 1) {
      return path[0].text_code ? t(path[0].text_code) : ''
    }
    return lbl(`step_${level}_title`)
  }, [level, path, lbl, t])
  const stepHint = lbl(`step_${level}_hint`)

  // ── Persistance
  const resetDraft = useCallback(() => {
    setPath([])
    setIntensity(midIntensity)
    setContext([])
    setNotes('')
  }, [midIntensity])

  const persistEntry = useCallback(async (
    finalPath: TreeNode[],
    finalIntensity: number | null,
    finalContext: string[],
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
          emoji: n.emoji,
        })),
        intensity: finalIntensity,
        notes: finalNotes.trim() || null,
        context: finalContext,
      })
      await loadEntries()
      resetDraft()
      setMode('history')
    } finally {
      setSaving(false)
    }
  }, [moduleId, loadEntries, resetDraft])

  // ── Enchaînement des étapes optionnelles après une sélection validée
  const proceedFrom = useCallback((finalPath: TreeNode[]) => {
    setPath(finalPath)
    if (enableIntensity) { setMode('intensity'); return }
    if (enableContext) { setMode('context'); return }
    if (enableNotes) { setMode('notes'); return }
    void persistEntry(finalPath, null, [], '')
  }, [enableIntensity, enableContext, enableNotes, persistEntry])

  // ── Navigation
  const handleStartNew = useCallback(() => {
    resetDraft()
    setMode('selection')
  }, [resetDraft])

  const handleSelectNode = useCallback((node: TreeNode) => {
    const newPath = [...path, node]
    if (node.children.length > 0) {
      setPath(newPath)
      return
    }
    proceedFrom(newPath)
  }, [path, proceedFrom])

  const handleValidateHere = useCallback(() => {
    proceedFrom(path)
  }, [path, proceedFrom])

  const handleBack = useCallback(() => {
    if (mode === 'notes') {
      if (enableContext) { setMode('context'); return }
      if (enableIntensity) { setMode('intensity'); return }
      setMode('selection'); return
    }
    if (mode === 'context') {
      if (enableIntensity) { setMode('intensity'); return }
      setMode('selection'); return
    }
    if (mode === 'intensity') { setMode('selection'); return }
    if (path.length > 0) { setPath(prev => prev.slice(0, -1)); return }
    setMode('history')
  }, [mode, path, enableContext, enableIntensity])

  const handleCancel = useCallback(() => {
    resetDraft()
    setMode('history')
  }, [resetDraft])

  const handleConfirmIntensity = useCallback(() => {
    if (enableContext) { setMode('context'); return }
    if (enableNotes) { setMode('notes'); return }
    void persistEntry(path, intensity, context, '')
  }, [enableContext, enableNotes, persistEntry, path, intensity, context])

  const handleConfirmContext = useCallback(() => {
    if (enableNotes) { setMode('notes'); return }
    void persistEntry(path, enableIntensity ? intensity : null, context, '')
  }, [enableNotes, persistEntry, path, enableIntensity, intensity, context])

  const handleSaveFinal = useCallback(() => {
    void persistEntry(path, enableIntensity ? intensity : null, context, notes)
  }, [persistEntry, path, enableIntensity, intensity, context, notes])

  const toggleContext = useCallback((code: string) => {
    setContext(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }, [])

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
  }, [t, showConfirm, lbl])

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
                const rootEmoji = rootNode?.emoji
                const cardIcon = (rootNode?.icon ?? 'palette-outline') as McIcon
                const labels = entry.path.map(n => resolvePathLabel(n, t)).filter(Boolean)
                return (
                  <View
                    key={entry.id}
                    style={[styles.entryCard, { borderLeftColor: cardColor }]}
                    testID={`entry-card-${entry.id}`}
                  >
                    <View style={styles.entryHeader}>
                      <View style={[styles.entryIcon, { backgroundColor: cardColor + '1A' }]}>
                        {rootEmoji ? (
                          <Text style={styles.entryEmoji}>{rootEmoji}</Text>
                        ) : (
                          <MaterialCommunityIcons name={cardIcon} size={20} color={cardColor} />
                        )}
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
                    {entry.context.length > 0 ? (
                      <View style={styles.entryChips} testID={`chips-${entry.id}`}>
                        {entry.context.map(code => (
                          <Chip key={code} label={t(code)} size="sm" muted />
                        ))}
                      </View>
                    ) : null}
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

  // Fil d'Ariane + progression (modes de saisie)
  const breadcrumb = path.map(n => (n.text_code ? t(n.text_code) : '')).filter(Boolean).join(' › ')
  const progress = level / Math.max(level, 3)

  // Teinte douce de la famille choisie, irrigue tout l'écran de saisie
  const tintStyle = path.length > 0 ? { backgroundColor: accentColor + '08' } : null

  // ── Mode sélection (navigation dans l'arbre) ───────────────────────────────
  if (mode === 'selection') {
    const showValidate = enableEarlyValidate && path.length > 0 && currentNodes.length > 0
    const validateLabel = lbl('validate_here_btn') || t('common.validate')
    const lastLabel = path.length > 0 && path[path.length - 1].text_code
      ? t(path[path.length - 1].text_code!)
      : ''
    return (
      <View style={[styles.container, tintStyle]}>
        <TreeSelectorHeader
          onBack={handleBack}
          showProgress
          accentColor={accentColor}
          breadcrumb={breadcrumb}
          progress={progress}
        />
        <ScrollView contentContainerStyle={styles.selectionContent}>
          {stepTitle ? <Text style={styles.stepTitle}>{stepTitle}</Text> : null}
          {stepHint ? <Text style={styles.stepHint}>{stepHint}</Text> : null}

          {level === 1 ? (
            <View style={styles.gridContainer} testID="level-1-grid">
              {currentNodes.map(node => {
                const nodeColor = node.color ?? colors.primary
                const label = node.text_code ? t(node.text_code) : ''
                return (
                  <Pressable
                    key={node.id}
                    style={({ pressed }) => [
                      styles.primaryCard,
                      { borderColor: nodeColor, backgroundColor: nodeColor + '12' },
                      pressed && styles.cardPressed,
                    ]}
                    onPress={() => handleSelectNode(node)}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    testID={`node-${node.id}`}
                  >
                    <View style={[styles.primaryIconCircle, { backgroundColor: nodeColor + '22' }]}>
                      {node.emoji ? (
                        <Text style={styles.primaryEmoji}>{node.emoji}</Text>
                      ) : (
                        <MaterialCommunityIcons
                          name={(node.icon ?? 'circle-outline') as McIcon}
                          size={26}
                          color={nodeColor}
                        />
                      )}
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
                    style={({ pressed }) => [
                      styles.optionCard,
                      { borderLeftColor: nodeColor },
                      pressed && styles.cardPressed,
                    ]}
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

          {showValidate ? (
            <Pressable
              style={[styles.validateHereBtn, { borderColor: accentColor }]}
              onPress={handleValidateHere}
              accessibilityRole="button"
              accessibilityLabel={validateLabel}
              testID="validate-here"
            >
              <MaterialCommunityIcons name="check" size={18} color={accentColor} />
              <Text style={[styles.validateHereText, { color: accentColor }]}>
                {lastLabel ? `${validateLabel} : ${lastLabel}` : validateLabel}
              </Text>
            </Pressable>
          ) : null}

          {level === 1 && footer != null && (
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={14} color={colors.textMuted} />
              <Text style={styles.footerText}>{t(footer.text_code ?? '')}</Text>
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
      <View style={[styles.container, tintStyle]}>
        <TreeSelectorHeader
          onBack={handleBack}
          showProgress={false}
          accentColor={accentColor}
          breadcrumb={breadcrumb}
          progress={progress}
        />
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

  // ── Mode contexte (chips multi-choix, facultatif) ──────────────────────────
  if (mode === 'context') {
    const contextTitle = lbl('context_title')
    const contextHint = lbl('context_hint')
    const continueLabel = lbl('continue_btn') || t('common.continue')
    return (
      <View style={[styles.container, tintStyle]}>
        <TreeSelectorHeader
          onBack={handleBack}
          showProgress={false}
          accentColor={accentColor}
          breadcrumb={breadcrumb}
          progress={progress}
        />
        <ScrollView contentContainerStyle={styles.selectionContent}>
          {contextTitle ? <Text style={styles.stepTitle}>{contextTitle}</Text> : null}
          {contextHint ? <Text style={styles.stepHint}>{contextHint}</Text> : null}

          <View style={styles.chipsWrap} testID="context-chips">
            {contextOptions.map(opt => {
              const isActive = context.includes(opt.code)
              return (
                <Chip
                  key={opt.code}
                  label={t(opt.code)}
                  selected={isActive}
                  color={accentColor}
                  onPress={() => toggleContext(opt.code)}
                  testID={`context-${opt.code}`}
                  icon={
                    <MaterialCommunityIcons
                      name={opt.icon}
                      size={16}
                      color={isActive ? accentColor : colors.textMuted}
                    />
                  }
                />
              )
            })}
          </View>

          <Pressable
            style={[styles.continueBtn, { backgroundColor: accentColor }]}
            onPress={handleConfirmContext}
            accessibilityRole="button"
            accessibilityLabel={continueLabel}
            testID="continue-context"
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
      style={[styles.container, tintStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <TreeSelectorHeader
        onBack={handleBack}
        showProgress={false}
        accentColor={accentColor}
        breadcrumb={breadcrumb}
        progress={progress}
      />
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
