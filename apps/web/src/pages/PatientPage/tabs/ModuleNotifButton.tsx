import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { Button } from '@ui/Button'
import { Tooltip } from '@ui/Tooltip'

interface ModuleNotifButtonProps {
  onClick: () => void
}

/**
 * Bouton icône « Configurer les rappels » (cloche) partagé par les cartes de l'armoire
 * module. Icône seule : libellé porté par le tooltip et l'`aria-label`.
 */
export function ModuleNotifButton({ onClick }: ModuleNotifButtonProps) {
  const { t } = useTranslation()
  const label = t('notifications.configure_button')
  return (
    <Tooltip label={label}>
      <Button
        variant="outline"
        size="xs"
        aria-label={label}
        icon={<Bell size={14} />}
        onClick={onClick}
      />
    </Tooltip>
  )
}
