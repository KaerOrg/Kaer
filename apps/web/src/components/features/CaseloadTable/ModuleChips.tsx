import { useTranslation } from 'react-i18next'
import { Smartphone } from 'lucide-react'
import { Chip } from '../../ui/Chip'

/**
 * `max` et `onOverflowClick` vont par paire : soit aucun (tout est affiché), soit les
 * deux (plafond + handler du « +N »). L'union interdit l'état « plafond sans handler ».
 */
export type ModuleChipsProps =
  | { moduleTypes: readonly string[]; max?: undefined; onOverflowClick?: undefined }
  | { moduleTypes: readonly string[]; max: number; onOverflowClick: () => void }

/**
 * Modules débloqués pour le patient lié (app), affichés en lecture seule. Dérivés de
 * patient_modules — non éditables ici. Avec `max`, le surplus est replié derrière un
 * « +N » qui appelle `onOverflowClick` (ex. colonne dense → ouvre le drawer) ; sans
 * `max`, tous les modules sont listés (ex. onglet « Soins » du drawer).
 */
export function ModuleChips({ moduleTypes, max, onOverflowClick }: ModuleChipsProps) {
  const { t } = useTranslation()
  if (moduleTypes.length === 0) return null

  const capped = max != null && moduleTypes.length > max
  const visible = capped ? moduleTypes.slice(0, max) : moduleTypes
  const extraCount = moduleTypes.length - visible.length

  return (
    <div className="module-chips" title={t('file_active.link.modules_hint')}>
      {visible.map(type => (
        <Chip
          key={type}
          tone="info"
          icon={<Smartphone size={11} aria-hidden="true" />}
          label={t(`modules.${type}.label`)}
        />
      ))}
      {capped ? (
        <Chip
          tone="info"
          label={`+${extraCount}`}
          onClick={onOverflowClick}
          title={t('file_active.link.modules_more', { count: extraCount })}
        />
      ) : null}
    </div>
  )
}
