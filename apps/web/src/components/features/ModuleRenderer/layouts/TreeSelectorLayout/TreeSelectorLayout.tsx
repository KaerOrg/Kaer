// ─── Layout web `tree_selector` — wrapper métier du primitive @ui/TreeSelector ─
//
// Aperçu praticien INTERACTIF, miroir fidèle du flux patient mobile
// (preview_kind 'tree_selector', module emotion_wheel). Lecture seule : aucune
// persistance — « Enregistrer » revient à l'historique (le primitive gère le reset).
//
// Responsabilité du wrapper : parser la config DB-driven (`module_content_fields`),
// traduire tous les libellés et mapper l'arbre vers les props du primitive. Toute
// l'interaction (navigation, étapes, saisie) vit dans `@ui/TreeSelector`.
// Source mobile : apps/mobile/.../layouts/TreeSelector/TreeSelectorLayout.tsx.

import { useMemo, useCallback } from 'react'
import type { ContentField } from '@services/moduleService'
import {
  TreeSelector,
  type TreeSelectorConfig, type TreeSelectorTexts,
} from '@ui/TreeSelector'
import { buildUiNodes, buildContextOptions, intensityValuesFor, parseIntOr, buildStepLabels } from './helpers'

interface Props {
  fields: ContentField[]
  footer?: ContentField
  t: (key: string) => string
}

export function TreeSelectorLayout({ fields, footer, t }: Props) {
  const props = useMemo(
    () => fields.find(f => f.field_type === 'tree_selector_config')?.props ?? {},
    [fields],
  )
  const lbl = useCallback((key: string): string => {
    const code = props[key]
    return code ? t(code) : ''
  }, [props, t])

  const nodes = useMemo(() => buildUiNodes(fields, t), [fields, t])

  const config = useMemo<TreeSelectorConfig>(() => {
    const intensityMin = parseIntOr(props['intensity_min'], 1)
    const intensityMax = parseIntOr(props['intensity_max'], 10)
    return {
      enableIntensity: props['enable_intensity'] === '1',
      enableNotes: props['enable_notes'] === '1',
      enableContext: props['enable_context'] === '1',
      enableEarlyValidate: props['enable_early_validate'] === '1',
      intensityMax,
      intensityValues: intensityValuesFor(intensityMin, intensityMax),
      midIntensity: Math.round((intensityMin + intensityMax) / 2),
      contextOptions: buildContextOptions(props, t),
    }
  }, [props, t])

  const texts = useMemo<TreeSelectorTexts>(() => ({
    newBtn: lbl('new_btn'),
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
    continueBtn: lbl('continue_btn'),
    saveBtn: lbl('save_btn'),
    validateHereBtn: lbl('validate_here_btn'),
    cancel: t('common.cancel'),
    back: t('common.back'),
    stepTitles: buildStepLabels(props, t, 'title'),
    stepHints: buildStepLabels(props, t, 'hint'),
  }), [lbl, t, props])

  const footerText = footer?.text_code ? t(footer.text_code) : null

  return <TreeSelector nodes={nodes} config={config} texts={texts} footerText={footerText} />
}
