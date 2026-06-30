// Mode « sélection » (web) : navigation niveau par niveau. Niveau 1 = grille des
// familles (emoji + couleur), niveaux suivants = liste. Profondeur libre = bouton
// « valider ici ».

import { Check, ChevronRight, Info } from 'lucide-react'
import { Button } from '@ui/Button'
import { TreeSelectorHeader } from './TreeSelectorHeader'
import { resolveAccent, buildBreadcrumb, tintOf } from './helpers'
import type { TreeSelectorConfig, TreeSelectorNode, TreeSelectorTexts } from './types'

interface TreeSelectorNavigationProps {
  nodes: TreeSelectorNode[]
  path: TreeSelectorNode[]
  config: TreeSelectorConfig
  texts: TreeSelectorTexts
  footerText?: string | null
  onBack: () => void
  onSelectNode: (node: TreeSelectorNode) => void
  onValidateHere: () => void
}

export function TreeSelectorNavigation({
  nodes, path, config, texts, footerText, onBack, onSelectNode, onValidateHere,
}: TreeSelectorNavigationProps) {
  const accent = resolveAccent(path)
  const breadcrumb = buildBreadcrumb(path)
  const level = path.length + 1
  const progress = level / Math.max(level, 3)
  const tint = tintOf(accent)
  const currentNodes = path.length === 0 ? nodes : path[path.length - 1].children

  // Niveau 2 : le titre est la famille racine choisie ; sinon, titre configuré.
  const stepTitle = level === 2 && path[0] ? path[0].label : (texts.stepTitles[level] ?? '')
  const stepHint = texts.stepHints[level] ?? ''

  const showValidate = config.enableEarlyValidate && path.length > 0 && currentNodes.length > 0
  const lastLabel = path.length > 0 ? path[path.length - 1].label : ''
  const validateLabel = lastLabel ? `${texts.validateHereBtn} : ${lastLabel}` : texts.validateHereBtn

  return (
    <div className="ts" style={{ background: tint }}>
      <TreeSelectorHeader showProgress accentColor={accent} breadcrumb={breadcrumb} progress={progress} backLabel={texts.back} onBack={onBack} />
      {stepTitle && <span className="ts-step-title">{stepTitle}</span>}
      {stepHint && <span className="ts-step-hint">{stepHint}</span>}

      {level === 1 ? (
        <div className="ts-primary-grid">
          {currentNodes.map(node => {
            const color = node.color ?? 'var(--color-primary)'
            return (
              <button
                key={node.id}
                type="button"
                className="ts-primary"
                style={{ borderColor: color, background: tintOf(color, '12') }}
                onClick={() => onSelectNode(node)}
              >
                {node.emoji && <span className="ts-primary__emoji">{node.emoji}</span>}
                <span className="ts-primary__label" style={{ color }}>{node.label}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="ts-options">
          {currentNodes.map(node => {
            const color = node.color ?? accent
            return (
              <button key={node.id} type="button" className="ts-option" style={{ borderLeftColor: color }} onClick={() => onSelectNode(node)}>
                <span className="ts-option__label" style={{ color }}>{node.label}</span>
                <ChevronRight size={18} />
              </button>
            )
          })}
        </div>
      )}

      {showValidate && (
        <Button variant="outline" type="button" fullWidth className="ts-validate" icon={<Check size={16} />} style={{ borderColor: accent, color: accent }} onClick={onValidateHere}>
          {validateLabel}
        </Button>
      )}

      {level === 1 && footerText && (
        <p className="ts-footer"><Info size={13} /><span>{footerText}</span></p>
      )}
    </div>
  )
}
