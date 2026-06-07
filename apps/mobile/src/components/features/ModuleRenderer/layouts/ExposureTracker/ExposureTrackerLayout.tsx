// ─── Layout `exposure_tracker` — Parcours d'exposition unifié ────────────────
//
// Refonte du Thermomètre de la peur, inspirée des outils de référence les plus
// utilisés (Mayo Clinic Anxiety Coach, MindShift CBT, Exposure: Face Your Fears).
// Un seul parcours : échelle de la peur → marches classées → expositions
// répétées vécues comme une expérience (prédiction → pic → résultat) → courbe.
//
// Conformité MDR 2017/745 : le code affiche des valeurs brutes saisies par le
// patient (SUDS, textes), une courbe neutre, des compteurs. Aucune
// interprétation, aucun seuil, aucune conclusion, aucune couleur de gravité.
//
// Spec : docs/spec/exposure-journey.md

import React, { useCallback, useMemo, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '../../../../../theme'
import {
  generateId, type FearEntry, type FearSituation,
} from '../../../../../lib/database'
import {
  saveFearEntry, deleteFearEntry, saveFearSituation, deleteFearSituation,
} from '../../../../../services/fearTrackerService'
import { useTeen } from '../../../../../hooks/useTeen'
import { useToast } from '../../../../../contexts/ToastContext'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import type { ContentField } from '../../../../../services/moduleService'
import type { ExposureConfig, ExposureDraft, ExposureMode } from './types'
import { buildSudsSteps, serializeStrategies, deserializeStrategies, sortSteps } from './exposureLogic'
import { useExposureData } from './useExposureData'
import { LadderList } from './LadderList'
import { StepFormView } from './StepFormView'
import { StepDetail } from './StepDetail'
import { ExposureForm, type StrategyOption } from './ExposureForm'
import { etStyles } from './styles'

export interface ExposureTrackerLayoutProps {
  fields: ContentField[]
  footer?: ContentField
  moduleId: string
}

export function ExposureTrackerLayout({ fields, moduleId }: ExposureTrackerLayoutProps) {
  const { isTeenMode } = useTeen()
  const { t } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const { showToast } = useToast()
  const { showConfirm } = useConfirmDialog()
  const { loading, situations, entries, reload } = useExposureData()

  const [mode, setMode] = useState<ExposureMode>({ kind: 'ladder' })
  const [saving, setSaving] = useState(false)

  // ── Résolution config / stratégies / libellés ────────────────────────────
  const configField = useMemo(() => fields.find(f => f.field_type === 'exposure_tracker_config'), [fields])

  const config = useMemo<ExposureConfig>(() => ({
    sudsMin: parseInt(configField?.props['suds_min'] ?? '0', 10),
    sudsMax: parseInt(configField?.props['suds_max'] ?? '100', 10),
    sudsStep: parseInt(configField?.props['suds_step'] ?? '10', 10),
    sudsDefaultBefore: parseInt(configField?.props['suds_default_before'] ?? '50', 10),
    beforeColor: configField?.props['suds_before_color'] ?? colors.danger,
    peakColor: configField?.props['suds_peak_color'] ?? colors.primary,
    afterColor: configField?.props['suds_after_color'] ?? colors.success,
  }), [configField])

  const sudsSteps = useMemo(
    () => buildSudsSteps(config.sudsMin, config.sudsMax, config.sudsStep),
    [config.sudsMin, config.sudsMax, config.sudsStep],
  )

  const strategyFields = useMemo(
    () => fields
      .filter(f => f.field_type === 'exposure_tracker_strategy')
      .sort((a, b) => a.sort_order - b.sort_order),
    [fields],
  )

  const strategyOptions = useMemo<StrategyOption[]>(
    () => strategyFields
      .map(f => ({ id: f.id, label: f.text_code ? t(f.text_code) : '' }))
      .filter(o => o.label.length > 0),
    [strategyFields, t],
  )

  const strategyLabelByKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const o of strategyOptions) map.set(o.id, o.label)
    return map
  }, [strategyOptions])

  const lbl = useCallback(
    (k: string, opts?: Record<string, string | number>) => t(`modules.${moduleId}.${k}`, opts),
    [t, moduleId],
  )

  const sortedSteps = useMemo(() => sortSteps(situations), [situations])

  const resolveStrategyLabels = useCallback((entry: FearEntry): string[] => {
    const { selected, custom } = deserializeStrategies(entry.strategies)
    const labels = selected.map(key => strategyLabelByKey.get(key) ?? key)
    if (custom.trim()) labels.push(custom.trim())
    return labels
  }, [strategyLabelByKey])

  // ── Marches ───────────────────────────────────────────────────────────────
  const handleToggleDone = useCallback(async (step: FearSituation) => {
    await saveFearSituation({
      id: step.id,
      label: step.label,
      hierarchy_id: step.hierarchy_id,
      target_suds: step.target_suds,
      is_done: step.is_done === 1 ? 0 : 1,
    })
    await reload()
  }, [reload])

  const handleSaveStep = useCallback(async (label: string, target: number) => {
    const editingId = mode.kind === 'step_form' ? mode.stepId : null
    const existing = editingId ? situations.find(s => s.id === editingId) : null
    const id = editingId ?? generateId()
    await saveFearSituation({
      id,
      label,
      hierarchy_id: existing?.hierarchy_id ?? null,
      target_suds: target,
      is_done: existing?.is_done ?? 0,
    })
    await reload()
    setMode({ kind: 'detail', stepId: id })
  }, [mode, situations, reload])

  const handleDeleteStep = useCallback((step: FearSituation) => {
    showConfirm({
      title: t('common.delete'),
      message: t('common.irreversible'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deleteFearSituation(step.id)
        await reload()
        setMode({ kind: 'ladder' })
      },
    })
  }, [reload, t, showConfirm])

  // ── Expositions ─────────────────────────────────────────────────────────
  const handleSaveExposure = useCallback(async (step: FearSituation, draft: ExposureDraft) => {
    const editingId = mode.kind === 'exposure' ? mode.entryId : null
    setSaving(true)
    try {
      const id = editingId ?? generateId()
      const entry: Omit<FearEntry, 'created_at'> = {
        id,
        date: draft.date,
        situation_id: step.id,
        situation_label: step.label,
        suds_before: draft.suds_before,
        suds_peak: draft.suds_peak,
        strategies: serializeStrategies(draft.selectedStrategies, draft.customStrategy),
        custom_strategy: draft.customStrategy,
        suds_after: draft.suds_after,
        expectation_text: draft.expectation_text,
        outcome_text: draft.outcome_text,
        notes: draft.notes,
      }
      await saveFearEntry(entry)
      await reload()
      setMode({ kind: 'detail', stepId: step.id })
    } catch {
      showToast(t('common.save_error'), 'error')
    } finally {
      setSaving(false)
    }
  }, [mode, reload, t, showToast])

  const handleDeleteExposure = useCallback((step: FearSituation, entry: FearEntry) => {
    showConfirm({
      title: t('common.delete'),
      message: t('common.irreversible'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deleteFearEntry(entry.id)
        await reload()
        setMode({ kind: 'detail', stepId: step.id })
      },
    })
  }, [reload, t, showConfirm])

  if (loading) {
    return (
      <View style={etStyles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  // ── Rendu par mode ────────────────────────────────────────────────────────
  if (mode.kind === 'step_form') {
    const editing = mode.stepId ? situations.find(s => s.id === mode.stepId) : null
    return (
      <StepFormView
        initialLabel={editing?.label ?? ''}
        initialTarget={editing?.target_suds ?? config.sudsDefaultBefore}
        sudsSteps={sudsSteps}
        isNew={editing == null}
        lbl={lbl}
        tCommon={t}
        onBack={() => setMode(editing ? { kind: 'detail', stepId: editing.id } : { kind: 'ladder' })}
        onSave={handleSaveStep}
      />
    )
  }

  if (mode.kind === 'detail') {
    const step = situations.find(s => s.id === mode.stepId)
    if (!step) return null
    return (
      <StepDetail
        step={step}
        entries={entries}
        config={config}
        lbl={lbl}
        tCommon={t}
        resolveStrategyLabels={resolveStrategyLabels}
        onBack={() => setMode({ kind: 'ladder' })}
        onEditStep={() => setMode({ kind: 'step_form', stepId: step.id })}
        onDeleteStep={() => handleDeleteStep(step)}
        onDoExposure={() => setMode({ kind: 'exposure', stepId: step.id, entryId: null })}
        onEditExposure={(entryId) => setMode({ kind: 'exposure', stepId: step.id, entryId })}
        onDeleteExposure={(entry) => handleDeleteExposure(step, entry)}
      />
    )
  }

  if (mode.kind === 'exposure') {
    const step = situations.find(s => s.id === mode.stepId)
    if (!step) return null
    const existing = mode.entryId ? entries.find(e => e.id === mode.entryId) ?? null : null
    return (
      <ExposureForm
        step={step}
        existing={existing}
        config={config}
        sudsSteps={sudsSteps}
        strategyOptions={strategyOptions}
        saving={saving}
        lbl={lbl}
        tCommon={t}
        onBack={() => setMode({ kind: 'detail', stepId: step.id })}
        onSave={(draft) => handleSaveExposure(step, draft)}
        onDelete={() => { if (existing) handleDeleteExposure(step, existing) }}
      />
    )
  }

  return (
    <LadderList
      steps={sortedSteps}
      entries={entries}
      config={config}
      moduleKey={moduleId}
      isTeenMode={isTeenMode}
      lbl={lbl}
      onOpenStep={(id) => setMode({ kind: 'detail', stepId: id })}
      onToggleDone={handleToggleDone}
      onAddStep={() => setMode({ kind: 'step_form', stepId: null })}
    />
  )
}
