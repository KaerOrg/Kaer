import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@ui/Button'
import { Tooltip } from '@ui/Tooltip'

interface ModulePreviewButtonProps {
  open: boolean
  onToggle: () => void
}

/**
 * Bouton icône « Aperçu » (œil) partagé par toutes les cartes de l'armoire module.
 * Icône seule : le libellé est porté par le tooltip et l'`aria-label`. Source unique
 * pour garantir l'uniformité de la rangée d'actions sur toutes les cartes.
 */
export function ModulePreviewButton({ open, onToggle }: ModulePreviewButtonProps) {
  const { t } = useTranslation()
  const label = t('patient.preview_button')
  return (
    <Tooltip label={label}>
      <Button
        variant="outline"
        size="xs"
        aria-pressed={open}
        aria-label={label}
        icon={open ? <EyeOff size={14} /> : <Eye size={14} />}
        onClick={onToggle}
      />
    </Tooltip>
  )
}
