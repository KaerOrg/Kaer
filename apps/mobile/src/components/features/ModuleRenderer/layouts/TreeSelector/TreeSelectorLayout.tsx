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

import { useMemo, useCallback, useState } from 'react'
import { collectIndexed } from '@kaer/shared'
import type { ContentField } from '@services/moduleService'
import type { TreeSelection } from '../../../../../lib/database'
import { generateId } from '../../../../../lib/database'
import { formatDateTime, formatDateFull } from '../../../../../lib/dateUtils'
import { useModuleTranslation, type ModuleTranslationValues } from '../../../../../hooks/useModuleT'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { useActionSheet } from '../../../../../contexts/ActionSheetContext'
import {
  TreeSelector,
  type TreeSelectorConfig, type TreeSelectorEditRequest, type TreeSelectorEntry,
  type TreeSelectorEntrySection, type TreeSelectorNode, type TreeSelectorSubmit,
  type TreeSelectorTexts,
} from '@ui/TreeSelector'
import { useTreeSelectorConfig } from './useTreeSelectorConfig'
import { useTreeSelectorData } from './useTreeSelectorData'
import { TreeSelectorInfoSheet } from './TreeSelectorInfoSheet'
import {
  toUiNodes, toEntryVM, reconstructPath, buildStepLabels, groupEntriesByDay,
  WORDLESS_SELECTED_ID,
} from './helpers'

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
  const { showActionSheet } = useActionSheet()
  const config = useTreeSelectorConfig(fields)
  const { entries, loading, saving, persist, remove } = useTreeSelectorData(moduleId)

  const lbl = useCallback((key: string, values?: ModuleTranslationValues): string => {
    const code = config.props[key]
    return code ? t(code, values) : ''
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
    intensityValues: config.intensityValues,
    contextOptions: config.rawContextOptions.map(o => ({ ...o, label: t(o.code) })),
  }), [config, t])

  const texts = useMemo<TreeSelectorTexts>(() => ({
    newBtn: lbl('new_btn') || t('common.add'),
    historyLabel: lbl('history_label'),
    emptyTitle: lbl('empty_title'),
    emptyText: lbl('empty_text'),
    entryTitle: lbl('entry_title'),
    wordlessTitle: lbl('wordless_title'),
    wordlessHint: lbl('wordless_hint'),
    intensityTitle: lbl('intensity_title'),
    intensityAnchorMin: lbl('intensity_anchor_min'),
    intensityAnchorMax: lbl('intensity_anchor_max'),
    contextTitle: lbl('context_title'),
    contextOtherBtn: lbl('context_other_btn'),
    contextOtherPlaceholder: lbl('context_other_placeholder'),
    notesTitle: lbl('notes_title'),
    notesPlaceholder: lbl('notes_placeholder'),
    continueBtn: lbl('continue_btn') || t('common.continue'),
    saveBtn: lbl('save_btn') || t('common.save'),
    validateHereBtn: lbl('validate_here_btn') || t('common.validate'),
    validateHereKeep: (label: string) => lbl('validate_here_keep', { label }),
    skipBtn: lbl('skip_btn'),
    stopHint: lbl('stop_hint'),
    cancel: t('common.cancel'),
    back: t('common.back'),
    delete: t('common.delete'),
    infoBtn: lbl('info_title') || t('common.info'),
    entryMenuBtn: t('common.options'),
    editReminderBtn: t('common.edit'),
    stepTitles: buildStepLabels(config.props, t, 'title'),
    stepHints: buildStepLabels(config.props, t, 'hint'),
  }), [lbl, t, config.props])

  const uiEntries = useMemo<TreeSelectorEntry[]>(
    () => entries.map(e =>
      toEntryVM(e, t, config.intensityMax, formatDateTime, config.nodeMap, lbl('wordless_label'))),
    [entries, t, config.intensityMax, config.nodeMap, lbl],
  )

  // Groupement par jour : une navigation, jamais une analyse (aucun total, aucune
  // moyenne, aucune comparaison d'un jour à l'autre).
  const sections = useMemo<TreeSelectorEntrySection[]>(() => {
    const byId = new Map(uiEntries.map(vm => [vm.id, vm]))
    const groups = groupEntriesByDay(entries, {
      today: lbl('day_today') || t('common.today'),
      yesterday: lbl('day_yesterday') || t('common.yesterday'),
      older: (iso: string) => formatDateFull(iso),
    }, new Date())
    return groups.map(g => ({
      title: g.title,
      entries: g.entries.map(e => byId.get(e.id)).filter((vm): vm is TreeSelectorEntry => vm != null),
    }))
  }, [entries, uiEntries, lbl, t])

  // Fiche ⓘ : à quoi ça sert, qui voit quoi, en cas de crise, sources. Elle reprend le
  // disclaimer sourcé qui était collé en permanence sur l'accueil (K-3).
  const infoSections = useMemo(() => {
    const titles = collectIndexed(config.props, 'info_title')
    const bodies = collectIndexed(config.props, 'info_body')
    const sourceNote = footer != null ? t(footer.text_code ?? '') : ''
    const list = titles.map((code, i) => ({
      title: t(code),
      body: bodies[i] ? t(bodies[i]) : '',
    }))
    if (sourceNote) list.push({ title: lbl('info_sources_title'), body: sourceNote })
    return list
  }, [config.props, footer, t, lbl])

  const [infoOpen, setInfoOpen] = useState(false)
  const openInfo = useCallback(() => setInfoOpen(true), [])
  const closeInfo = useCallback(() => setInfoOpen(false), [])

  // ── Callbacks métier ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (result: TreeSelectorSubmit) => {
    const path = reconstructPath(result.pathIds, config.nodeMap)
    // Chemin vide = entrée « sans mot » (K-7), légitime dès que la config l'autorise.
    // Sans cette autorisation, un chemin vide reste un état incohérent qu'on refuse.
    if (path.length === 0 && !config.enableWordless) return
    const leaf = path.length > 0 ? path[path.length - 1] : null
    // Modification : on réécrit l'entrée d'origine (même id, même horodatage) plutôt
    // que d'en créer une seconde. Sans `created_at`, `INSERT OR REPLACE` remettrait la
    // date à maintenant et l'entrée changerait de jour dans l'historique.
    const edited = result.editingId != null
      ? entries.find(e => e.id === result.editingId)
      : undefined
    const selection: Omit<TreeSelection, 'created_at'> & { created_at?: string } = {
      id: edited?.id ?? generateId(),
      created_at: edited?.created_at,
      module_id: moduleId,
      selected_id: leaf?.id ?? WORDLESS_SELECTED_ID,
      selected_label: leaf?.text_code ?? null,
      path,
      intensity: result.intensity,
      notes: result.notes.trim() || null,
      context: result.context,
      context_other: result.contextOther.trim() || null,
    }
    await persist(selection)
    setEditRequest(null)
  }, [config.nodeMap, config.enableWordless, entries, moduleId, persist])

  const handleDelete = useCallback((id: string) => {
    showConfirm({
      title: lbl('delete_title') || t('common.delete'),
      message: t('common.irreversible'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: () => remove(id),
    })
  }, [showConfirm, lbl, t, remove])

  // Modification (K-8) : on rouvre le flux pré-rempli à la première étape. L'entrée
  // conserve son identifiant ET son horodatage : une correction de saisie ne doit pas
  // faire remonter l'entrée en tête d'historique.
  const [editRequest, setEditRequest] = useState<TreeSelectorEditRequest | null>(null)

  const handleEdit = useCallback((id: string) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    setEditRequest(prev => ({
      id: entry.id,
      wasWordless: entry.path.length === 0,
      intensity: entry.intensity,
      context: entry.context,
      contextOther: entry.context_other ?? '',
      notes: entry.notes ?? '',
      token: (prev?.token ?? 0) + 1,
    }))
  }, [entries])

  // ⋯ d'une entrée : rappel de l'entrée en titre, puis modifier / supprimer.
  const handleOpenEntryMenu = useCallback((id: string) => {
    const entry = uiEntries.find(e => e.id === id)
    const recap = entry
      ? [entry.primaryLabel, entry.secondaryLabel].filter(Boolean).join(' · ')
      : ''
    showActionSheet({
      title: recap,
      options: [
        { label: lbl('edit_entry_btn') || t('common.modify'), onPress: () => handleEdit(id) },
        { label: t('common.delete'), destructive: true, onPress: () => handleDelete(id) },
      ],
    })
  }, [uiEntries, showActionSheet, lbl, t, handleEdit, handleDelete])

  return (
    <>
      <TreeSelector
        nodes={uiNodes}
        sections={sections}
        config={uiConfig}
        texts={texts}
        loading={loading}
        saving={saving}
        onSubmit={handleSubmit}
        onOpenEntryMenu={handleOpenEntryMenu}
        editRequest={editRequest}
        onOpenInfo={infoSections.length > 0 ? openInfo : undefined}
        allowWordless={config.enableWordless}
      />
      <TreeSelectorInfoSheet
        visible={infoOpen}
        title={lbl('info_title')}
        sections={infoSections}
        closeLabel={t('common.close')}
        onClose={closeInfo}
      />
    </>
  )
}
