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
import { TreeSelectorEntrySheet } from './TreeSelectorEntrySheet'
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
   * Sortie du niveau 1 sans rien nommer (« Je ne sais pas trop »). Le bouton
   * n'apparaît que si ce callback est fourni : un arbre sans porte de sortie
   * n'en affiche pas.
   */
  onSkip?: () => void
}

export function TreeSelector({
  nodes, entries, config, texts, footerText, loading, saving, onSubmit, onDelete, onSkip,
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
        expanded={flow.expanded}
        onBack={flow.handleBack}
        onSelectNode={flow.handleSelectNode}
        onSelectLeaf={flow.handleSelectLeaf}
        onToggleExpand={flow.handleToggleExpand}
        onContinue={flow.handleContinue}
        onValidateHere={flow.handleValidateHere}
        onSkip={onSkip}
      />
    )
  }

  return (
    <TreeSelectorEntrySheet
      path={flow.path}
      intensity={flow.intensity}
      context={flow.context}
      contextOther={flow.contextOther}
      contextOtherOpen={flow.contextOtherOpen}
      notes={flow.notes}
      config={config}
      texts={texts}
      saving={saving}
      onBack={flow.handleBack}
      onChangeIntensity={flow.setIntensity}
      onToggleContext={flow.toggleContext}
      onToggleContextOther={flow.toggleContextOther}
      onChangeContextOther={flow.setContextOther}
      onChangeNotes={flow.setNotes}
      onCancel={flow.handleCancel}
      onSave={flow.handleSaveFinal}
    />
  )
}
