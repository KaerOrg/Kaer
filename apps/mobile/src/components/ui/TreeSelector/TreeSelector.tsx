// Primitive générique `ui/TreeSelector` — sélecteur hiérarchique guidé.
//
// 100 % présentationnel : piloté par props (arbre + entrées + config + libellés
// déjà traduits) et callbacks (`onSubmit`, `onDelete`). Aucune connaissance d'un
// service, d'une persistance ou d'une clé i18n de domaine — réutilisable par tout
// module ayant besoin d'une navigation « famille → sous-catégorie → … » avec
// étapes optionnelles intensité / contexte / notes.
//
// La machine d'état du flux vit dans `useTreeSelectorFlow` ; chaque mode est un
// composant dédié (history / navigation / intensity / context / notes).

import { useCallback } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { colors } from '@theme'
import { useTreeSelectorFlow } from './useTreeSelectorFlow'
import { TreeSelectorHistory } from './TreeSelectorHistory'
import { TreeSelectorNavigation } from './TreeSelectorNavigation'
import { TreeSelectorIntensity } from './TreeSelectorIntensity'
import { TreeSelectorContext } from './TreeSelectorContext'
import { TreeSelectorNotes } from './TreeSelectorNotes'
import { styles } from './styles'
import type {
  TreeSelectorConfig, TreeSelectorEntry, TreeSelectorNode,
  TreeSelectorSubmit, TreeSelectorTexts,
} from './types'

export interface TreeSelectorProps {
  /** Arbre de nœuds prêt à afficher (libellés résolus). */
  nodes: TreeSelectorNode[]
  /** Entrées d'historique (view-models résolus). */
  entries: TreeSelectorEntry[]
  config: TreeSelectorConfig
  texts: TreeSelectorTexts
  /** Note de bas de page (sources) — déjà traduite, optionnelle. */
  footerText?: string | null
  loading: boolean
  saving: boolean
  /** Appelé à la validation finale — le parent persiste puis l'historique se recharge. */
  onSubmit: (result: TreeSelectorSubmit) => Promise<void>
  onDelete: (id: string) => void
  /**
   * Notification optionnelle quand le patient quitte le niveau 1 sans rien nommer
   * (« Je ne sais pas trop »). La porte de sortie elle-même est pilotée par le
   * libellé `texts.skipBtn` (présent = bouton affiché) ; ce callback ne sert qu'à
   * prévenir le parent — le primitive referme déjà la sélection tout seul.
   */
  onSkip?: () => void
}

export function TreeSelector({
  nodes, entries, config, texts, footerText, loading, saving, onSubmit, onDelete, onSkip,
}: TreeSelectorProps) {
  const flow = useTreeSelectorFlow(config, onSubmit)

  // « Je ne sais pas trop » : refermer la sélection et revenir à l'historique (rien
  // n'est persisté), puis notifier le parent s'il le souhaite. Le reset est interne
  // au primitive — le parent n'a pas la main sur le mode du flux — d'où ce wrapper
  // plutôt qu'un simple passe-plat du callback parent.
  const handleSkip = useCallback(() => {
    flow.handleCancel()
    onSkip?.()
  }, [flow, onSkip])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (flow.mode === 'history') {
    return (
      <TreeSelectorHistory
        entries={entries}
        texts={texts}
        footerText={footerText}
        onStartNew={flow.handleStartNew}
        onDelete={onDelete}
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
        expanded={flow.expanded}
        onBack={flow.handleBack}
        onSelectNode={flow.handleSelectNode}
        onSelectLeaf={flow.handleSelectLeaf}
        onToggleExpand={flow.handleToggleExpand}
        onContinue={flow.handleContinue}
        onValidateHere={flow.handleValidateHere}
        onSkip={handleSkip}
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
      notes={flow.notes}
      intensity={flow.intensity}
      config={config}
      texts={texts}
      saving={saving}
      onBack={flow.handleBack}
      onChangeNotes={flow.setNotes}
      onCancel={flow.handleCancel}
      onSave={flow.handleSaveFinal}
    />
  )
}
