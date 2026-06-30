// Mode « notes » (web) : récapitulatif de la sélection + zone de texte (lecture
// seule en aperçu praticien) puis actions Annuler / Enregistrer.

import { Check } from 'lucide-react'
import { Button } from '@ui/Button'
import { TreeSelectorHeader } from './TreeSelectorHeader'
import { resolveAccent, buildBreadcrumb, tintOf } from './helpers'
import type { TreeSelectorConfig, TreeSelectorNode, TreeSelectorTexts } from './types'

interface TreeSelectorNotesProps {
  path: TreeSelectorNode[]
  intensity: number
  config: TreeSelectorConfig
  texts: TreeSelectorTexts
  onBack: () => void
  onCancel: () => void
  onSave: () => void
}

export function TreeSelectorNotes({
  path, intensity, config, texts, onBack, onCancel, onSave,
}: TreeSelectorNotesProps) {
  const accent = resolveAccent(path)
  const breadcrumb = buildBreadcrumb(path)
  const tint = tintOf(accent)
  const summary = path.map(n => n.label).filter(Boolean).join(' — ')

  return (
    <div className="ts" style={{ background: tint }}>
      <TreeSelectorHeader showProgress={false} accentColor={accent} breadcrumb={breadcrumb} progress={0} backLabel={texts.back} onBack={onBack} />
      {texts.notesTitle && <span className="ts-step-title">{texts.notesTitle}</span>}
      {texts.notesHint && <span className="ts-step-hint">{texts.notesHint}</span>}
      {summary && (
        <div className="ts-summary" style={{ borderLeftColor: accent }}>
          <span style={{ color: accent, fontWeight: 700 }}>{summary}</span>
          {config.enableIntensity && <span className="ts-summary__meta">{intensity}/{config.intensityMax}</span>}
        </div>
      )}
      <textarea className="ts-notes" placeholder={texts.notesPlaceholder} rows={4} readOnly />
      <div className="ts-actions">
        <Button variant="secondary" size="sm" type="button" className="ts-cancel" onClick={onCancel}>
          {texts.cancel}
        </Button>
        <Button variant="primary" type="button" className="ts-save" iconRight={<Check size={18} />} style={{ background: accent }} onClick={onSave}>
          {texts.saveBtn}
        </Button>
      </div>
    </div>
  )
}
