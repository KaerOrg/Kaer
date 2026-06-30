// Mode « intensité » (web) : sélecteur de valeur brute 1–N. La teinte reflète la
// famille choisie — aucune couleur de gravité (conformité MDR).

import { ArrowRight } from 'lucide-react'
import { Button } from '@ui/Button'
import { TreeSelectorHeader } from './TreeSelectorHeader'
import { resolveAccent, buildBreadcrumb, tintOf } from './helpers'
import type { TreeSelectorConfig, TreeSelectorNode, TreeSelectorTexts } from './types'

interface TreeSelectorIntensityProps {
  path: TreeSelectorNode[]
  intensity: number
  config: TreeSelectorConfig
  texts: TreeSelectorTexts
  onBack: () => void
  onChangeIntensity: (v: number) => void
  onConfirm: () => void
}

export function TreeSelectorIntensity({
  path, intensity, config, texts, onBack, onChangeIntensity, onConfirm,
}: TreeSelectorIntensityProps) {
  const accent = resolveAccent(path)
  const breadcrumb = buildBreadcrumb(path)
  const tint = tintOf(accent)

  return (
    <div className="ts" style={{ background: tint }}>
      <TreeSelectorHeader showProgress={false} accentColor={accent} breadcrumb={breadcrumb} progress={0} backLabel={texts.back} onBack={onBack} />
      {texts.intensityTitle && <span className="ts-step-title">{texts.intensityTitle}</span>}
      {texts.intensityHint && <span className="ts-step-hint">{texts.intensityHint}</span>}
      <div className="ts-intensity">
        <div className="ts-intensity__value" style={{ background: tint, color: accent }}>
          <strong>{intensity}</strong><span>/{config.intensityMax}</span>
        </div>
        <div className="ts-intensity__grid">
          {config.intensityValues.map(v => (
            <button
              key={v}
              type="button"
              className="ts-intensity__btn"
              style={intensity === v ? { background: accent, borderColor: accent, color: 'white' } : undefined}
              onClick={() => onChangeIntensity(v)}
            >{v}</button>
          ))}
        </div>
      </div>
      <Button variant="primary" type="button" fullWidth className="ts-continue" iconRight={<ArrowRight size={18} />} style={{ background: accent }} onClick={onConfirm}>
        {texts.continueBtn}
      </Button>
    </div>
  )
}
