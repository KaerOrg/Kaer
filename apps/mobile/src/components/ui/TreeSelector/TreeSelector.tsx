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
}

export function TreeSelector({
  nodes, entries, config, texts, footerText, loading, saving, onSubmit, onDelete,
}: TreeSelectorProps) {
  const flow = useTreeSelectorFlow(config, onSubmit)

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
