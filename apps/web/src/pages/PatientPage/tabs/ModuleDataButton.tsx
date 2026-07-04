import { useTranslation } from 'react-i18next'
import { LineChart } from 'lucide-react'
import { Button } from '@ui/Button'
import { Tooltip } from '@ui/Tooltip'

interface ModuleDataButtonProps {
  open: boolean
  onToggle: () => void
}

/**
 * Bouton icône « Données » (courbe) partagé par toutes les cartes de l'armoire module.
 * Icône seule : le libellé est porté par le tooltip et l'`aria-label`.
 */
export function ModuleDataButton({ open, onToggle }: ModuleDataButtonProps) {
  const { t } = useTranslation()
  const label = t('patient.data_button')
  return (
    <Tooltip label={label}>
      <Button
        variant="outline"
        size="xs"
        aria-pressed={open}
        aria-label={label}
        icon={<LineChart size={14} />}
        onClick={onToggle}
      />
    </Tooltip>
  )
}
