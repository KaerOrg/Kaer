import { Settings } from 'lucide-react'
import { Button } from '@ui/Button'
import { Tooltip } from '@ui/Tooltip'

interface ModuleConfigButtonProps {
  /** Libellé de configuration propre au module (ex. « Configurer le plan »). */
  label: string
  onClick: () => void
}

/**
 * Bouton icône « Configurer » (roue crantée) partagé par les cartes de l'armoire module.
 * Le libellé varie selon le module et est fourni par l'appelant : il est porté par le
 * tooltip et l'`aria-label`. Icône seule pour aligner toutes les rangées d'actions.
 */
export function ModuleConfigButton({ label, onClick }: ModuleConfigButtonProps) {
  return (
    <Tooltip label={label}>
      <Button
        variant="outline"
        size="xs"
        aria-label={label}
        icon={<Settings size={14} />}
        onClick={onClick}
      />
    </Tooltip>
  )
}
