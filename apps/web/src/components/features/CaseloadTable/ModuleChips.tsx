import { useTranslation } from 'react-i18next'
import { Smartphone } from 'lucide-react'
import { Chip } from '../../ui/Chip'

/**
 * Modules débloqués pour le patient lié (app), affichés en lecture seule dans
 * « Soins en cours ». Dérivés de patient_modules — non éditables ici.
 */
export function ModuleChips({ moduleTypes }: { moduleTypes: readonly string[] }) {
  const { t } = useTranslation()
  if (moduleTypes.length === 0) return null
  return (
    <div className="module-chips" title={t('file_active.link.modules_hint')}>
      {moduleTypes.map(type => (
        <Chip
          key={type}
          tone="info"
          icon={<Smartphone size={11} aria-hidden="true" />}
          label={t(`modules.${type}.label`)}
        />
      ))}
    </div>
  )
}
