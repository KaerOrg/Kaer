// ─── Layout `tree_selector` — wrapper métier du primitive `ui/TreeSelector` ──
//
// Responsabilité : faire le pont entre le moteur de modules et le primitive
// présentationnel. Il parse la config DB-driven (`module_content_fields`),
// charge/persiste/supprime les entrées via le service, traduit tous les libellés
// et mappe l'arbre + l'historique vers les view-models attendus par le primitive.
// Toute l'interaction (navigation, étapes, saisie) vit dans `ui/TreeSelector`.
//
// Conformité MDR 2017/745 : aucun seuil, aucune couleur de gravité — les
// couleurs/emojis codent l'identité de famille, l'affichage reste brut.

import { useMemo, useCallback } from 'react'
import type { ContentField } from '@services/moduleService'
import type { TreeSelection } from '../../../../../lib/database'
import { generateId } from '../../../../../lib/database'
import { formatDateTime } from '../../../../../lib/dateUtils'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import {
  TreeSelector,
  type TreeSelectorConfig, type TreeSelectorEntry, type TreeSelectorNode,
  type TreeSelectorSubmit, type TreeSelectorTexts,
} from '@ui/TreeSelector'
import { useTreeSelectorConfig } from './useTreeSelectorConfig'
import { useTreeSelectorData } from './useTreeSelectorData'
import { toUiNodes, toEntryVM, reconstructPath, buildStepLabels } from './helpers'

export interface TreeSelectorLayoutProps {
  /** Fields du module (config + nœuds d'arbre). */
  fields: ContentField[]
  /** Note de bas de page MDR (sources scientifiques) — affichée en mode historique. */
  footer?: ContentField
  /** Identifiant du module — clé de persistance des `tree_selections`. */
  moduleId: string
}

export function TreeSelectorLayout({ fields, footer, moduleId }: TreeSelectorLayoutProps) {
  const t = useModuleTranslation()
  const { showConfirm } = useConfirmDialog()
  const config = useTreeSelectorConfig(fields)
  const { entries, loading, saving, persist, remove } = useTreeSelectorData(moduleId)

  const lbl = useCallback((key: string): string => {
    const code = config.props[key]
    return code ? t(code) : ''
  }, [config.props, t])

  // ── Mapping config → props du primitive ────────────────────────────────────
  const uiNodes = useMemo<TreeSelectorNode[]>(
    () => toUiNodes(config.rawNodes, t),
    [config.rawNodes, t],
  )

  const uiConfig = useMemo<TreeSelectorConfig>(() => ({
    enableIntensity: config.enableIntensity,
    enableNotes: config.enableNotes,
    enableContext: config.enableContext,
    enableEarlyValidate: config.enableEarlyValidate,
    intensityMax: config.intensityMax,
    intensityValues: config.intensityValues,
    midIntensity: config.midIntensity,
    contextOptions: config.rawContextOptions.map(o => ({ ...o, label: t(o.code) })),
  }), [config, t])

  const texts = useMemo<TreeSelectorTexts>(() => ({
    newBtn: lbl('new_btn') || t('common.add'),
    intro: lbl('intro'),
    historyLabel: lbl('history_label'),
    emptyTitle: lbl('empty_title'),
    emptyText: lbl('empty_text'),
    intensityTitle: lbl('intensity_title'),
    intensityHint: lbl('intensity_hint'),
    contextTitle: lbl('context_title'),
    contextHint: lbl('context_hint'),
    notesTitle: lbl('notes_title'),
    notesHint: lbl('notes_hint'),
    notesPlaceholder: lbl('notes_placeholder'),
    continueBtn: lbl('continue_btn') || t('common.continue'),
    saveBtn: lbl('save_btn') || t('common.save'),
    validateHereBtn: lbl('validate_here_btn') || t('common.validate'),
    cancel: t('common.cancel'),
    back: t('common.back'),
    delete: t('common.delete'),
    stepTitles: buildStepLabels(config.props, t, 'title'),
    stepHints: buildStepLabels(config.props, t, 'hint'),
  }), [lbl, t, config.props])

  const uiEntries = useMemo<TreeSelectorEntry[]>(
    () => entries.map(e => toEntryVM(e, t, config.intensityMax, formatDateTime)),
    [entries, t, config.intensityMax],
  )

  const footerText = footer != null ? t(footer.text_code ?? '') : null

  // ── Callbacks métier ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (result: TreeSelectorSubmit) => {
    const path = reconstructPath(result.pathIds, config.nodeMap)
    if (path.length === 0) return
    const leaf = path[path.length - 1]
    const selection: Omit<TreeSelection, 'created_at'> = {
      id: generateId(),
      module_id: moduleId,
      selected_id: leaf.id,
      selected_label: leaf.text_code ?? null,
      path,
      intensity: result.intensity,
      notes: result.notes.trim() || null,
      context: result.context,
    }
    await persist(selection)
  }, [config.nodeMap, moduleId, persist])

  const handleDelete = useCallback((id: string) => {
    showConfirm({
      title: lbl('delete_title') || t('common.delete'),
      message: t('common.irreversible'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: () => remove(id),
    })
  }, [showConfirm, lbl, t, remove])

  return (
    <TreeSelector
      nodes={uiNodes}
      entries={uiEntries}
      config={uiConfig}
      texts={texts}
      footerText={footerText}
      loading={loading}
      saving={saving}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  )
}
