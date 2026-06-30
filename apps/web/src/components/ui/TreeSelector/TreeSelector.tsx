// Primitive générique `ui/TreeSelector` (web) — sélecteur hiérarchique guidé.
//
// Pendant web du primitive mobile : 100 % présentationnel, piloté par props
// (arbre + config + libellés résolus) et callback `onSubmit`. Aperçu praticien
// INTERACTIF en lecture seule — `onSubmit` est optionnel (le wrapper ne persiste
// pas). Aucune connaissance du moteur de modules ni de clé i18n de domaine.
//
// La machine d'état du flux vit dans `useTreeSelectorFlow` ; chaque mode est un
// composant dédié (history / navigation / intensity / context / notes).

import { useTreeSelectorFlow } from './useTreeSelectorFlow'
import { TreeSelectorHistory } from './TreeSelectorHistory'
import { TreeSelectorNavigation } from './TreeSelectorNavigation'
import { TreeSelectorIntensity } from './TreeSelectorIntensity'
import { TreeSelectorContext } from './TreeSelectorContext'
import { TreeSelectorNotes } from './TreeSelectorNotes'
import type {
  TreeSelectorConfig, TreeSelectorNode, TreeSelectorSubmit, TreeSelectorTexts,
} from './types'
import './TreeSelector.css'

export interface TreeSelectorProps {
  /** Arbre de nœuds prêt à afficher (libellés résolus). */
  nodes: TreeSelectorNode[]
  config: TreeSelectorConfig
  texts: TreeSelectorTexts
  /** Note de bas de page (sources) — déjà traduite, optionnelle. */
  footerText?: string | null
  /** Sélection validée — optionnel (aperçu praticien en lecture seule). */
  onSubmit?: (result: TreeSelectorSubmit) => void
}

export function TreeSelector({ nodes, config, texts, footerText, onSubmit }: TreeSelectorProps) {
  const flow = useTreeSelectorFlow(config, onSubmit)

  if (flow.mode === 'history') {
    return (
      <TreeSelectorHistory
        texts={texts}
        footerText={footerText}
        onStartNew={flow.handleStartNew}
      />
    )
  }

  if (flow.mode === 'selection') {
    return (
      <TreeSelectorNavigation
        nodes={nodes}
        path={flow.path}
        config={config}
        texts={texts}
        footerText={footerText}
        onBack={flow.handleBack}
        onSelectNode={flow.handleSelectNode}
        onValidateHere={flow.handleValidateHere}
      />
    )
  }

  if (flow.mode === 'intensity') {
    return (
      <TreeSelectorIntensity
        path={flow.path}
        intensity={flow.intensity}
        config={config}
        texts={texts}
        onBack={flow.handleBack}
        onChangeIntensity={flow.setIntensity}
        onConfirm={flow.handleConfirmIntensity}
      />
    )
  }

  if (flow.mode === 'context') {
    return (
      <TreeSelectorContext
        path={flow.path}
        context={flow.context}
        config={config}
        texts={texts}
        onBack={flow.handleBack}
        onToggleContext={flow.toggleContext}
        onConfirm={flow.handleConfirmContext}
      />
    )
  }

  return (
    <TreeSelectorNotes
      path={flow.path}
      intensity={flow.intensity}
      config={config}
      texts={texts}
      onBack={flow.handleBack}
      onCancel={flow.handleCancel}
      onSave={flow.handleSaveFinal}
    />
  )
}
