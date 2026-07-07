import type { ReactNode } from 'react'
import { ModuleNotifButton } from './ModuleNotifButton'
import { ModuleConfigButton } from './ModuleConfigButton'
import { ModulePreviewButton } from './ModulePreviewButton'
import { ModuleDataButton } from './ModuleDataButton'

interface ModuleCardFooterProps {
  /** Bouton cloche « Configurer les rappels ». Rendu si fourni. */
  onConfigureNotif?: () => void
  /** Libellé du bouton roue crantée (varie par module, ex. « Configurer le plan »). */
  configLabel?: string
  /** Bouton roue crantée de configuration. Rendu si `onConfigure` ET `configLabel` fournis. */
  onConfigure?: () => void
  previewOpen?: boolean
  /** Bouton œil « Aperçu ». Rendu si fourni. */
  onTogglePreview?: () => void
  dataOpen?: boolean
  /** Bouton courbe « Données ». Rendu si fourni. */
  onToggleData?: () => void
  /** Actions spécifiques à un module (rare), rendues en fin de rangée. */
  extra?: ReactNode
}

/**
 * Rangée d'actions (footer) partagée par toutes les cartes de l'armoire module.
 * Impose un **ordre canonique unique** : cloche, configuration (roue crantée),
 * aperçu, données, puis actions spécifiques. Chaque bouton n'est rendu que si son
 * handler est fourni. Passer par ce composant garantit un ordre et un habillage
 * identiques sur toutes les cartes — ne jamais réassembler la rangée à la main.
 */
export function ModuleCardFooter({
  onConfigureNotif,
  configLabel,
  onConfigure,
  previewOpen = false,
  onTogglePreview,
  dataOpen = false,
  onToggleData,
  extra,
}: ModuleCardFooterProps) {
  return (
    <>
      {onConfigureNotif && <ModuleNotifButton onClick={onConfigureNotif} />}
      {onConfigure && configLabel !== undefined && (
        <ModuleConfigButton label={configLabel} onClick={onConfigure} />
      )}
      {onTogglePreview && <ModulePreviewButton open={previewOpen} onToggle={onTogglePreview} />}
      {onToggleData && <ModuleDataButton open={dataOpen} onToggle={onToggleData} />}
      {extra}
    </>
  )
}
