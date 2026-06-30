// Mode « contexte » (web) : chips multi-choix facultatifs. Les codes sélectionnés
// sont renvoyés tels quels au parent (identités opaques).

import { ArrowRight } from 'lucide-react'
import { Button } from '@ui/Button'
import { Chip } from '@ui/Chip'
import { TreeSelectorHeader } from './TreeSelectorHeader'
import { resolveAccent, buildBreadcrumb, tintOf } from './helpers'
import type { TreeSelectorConfig, TreeSelectorNode, TreeSelectorTexts } from './types'

interface TreeSelectorContextProps {
  path: TreeSelectorNode[]
  context: string[]
  config: TreeSelectorConfig
  texts: TreeSelectorTexts
  onBack: () => void
  onToggleContext: (code: string) => void
  onConfirm: () => void
}

export function TreeSelectorContext({
  path, context, config, texts, onBack, onToggleContext, onConfirm,
}: TreeSelectorContextProps) {
  const accent = resolveAccent(path)
  const breadcrumb = buildBreadcrumb(path)
  const tint = tintOf(accent)

  return (
    <div className="ts" style={{ background: tint }}>
      <TreeSelectorHeader showProgress={false} accentColor={accent} breadcrumb={breadcrumb} progress={0} backLabel={texts.back} onBack={onBack} />
      {texts.contextTitle && <span className="ts-step-title">{texts.contextTitle}</span>}
      {texts.contextHint && <span className="ts-step-hint">{texts.contextHint}</span>}
      <div className="ts-chips">
        {config.contextOptions.map(opt => (
          <Chip
            key={opt.code}
            label={opt.label}
            className="ts-chip"
            selectable
            selected={context.includes(opt.code)}
            accentColor={accent}
            onClick={() => onToggleContext(opt.code)}
          />
        ))}
      </div>
      <Button variant="primary" type="button" fullWidth className="ts-continue" iconRight={<ArrowRight size={18} />} style={{ background: accent }} onClick={onConfirm}>
        {texts.continueBtn}
      </Button>
    </div>
  )
}
