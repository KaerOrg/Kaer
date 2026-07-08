import { useCallback, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@ui/Card'
import type { ModuleType, PatientModule } from '../../../lib/database.types'
import type { useBAActivitiesEditor } from '../hooks/useBAActivitiesEditor'
import { ModuleCardFooter } from './ModuleCardFooter'

const MODULE_TYPE: ModuleType = 'behavioral_activation'

type BAList = ReturnType<typeof useBAActivitiesEditor>

export interface BehavioralActivationCardProps {
  tagChips: ReactNode
  modIcon: ReactNode
  mod: PatientModule | undefined
  unlocked: boolean
  loading: boolean
  previewOpen: boolean
  dataOpen: boolean
  baList: BAList
  moduleToggle: (on: boolean, loading: boolean, onToggle: () => void) => ReactNode
  onTogglePreview: (type: ModuleType) => void
  onToggleData: (type: ModuleType) => void
  onConfigureNotif: (type: ModuleType) => void
  onConfigure: (type: ModuleType) => void
  onUnlock: (type: ModuleType) => void
  onRevoke: (moduleId: string) => void
}

/**
 * Carte module « Activation comportementale » de l'armoire praticien. L'édition des
 * activités co-construites se fait dans l'onglet Configuration de la modale d'actions ;
 * la carte n'affiche que le résumé (nombre d'activités) et les boutons d'ouverture.
 */
export function BehavioralActivationCard({
  tagChips, modIcon, mod, unlocked, loading,
  previewOpen, dataOpen, baList, moduleToggle,
  onTogglePreview, onToggleData, onConfigureNotif, onConfigure, onUnlock, onRevoke,
}: BehavioralActivationCardProps) {
  const { t, i18n } = useTranslation()

  const handleToggle = useCallback(() => {
    if (unlocked && mod) { baList.close(); onRevoke(mod.id) }
    else onUnlock(MODULE_TYPE)
  }, [unlocked, mod, baList, onRevoke, onUnlock])

  const handleNotif = useCallback(() => {
    if (!mod) return
    onConfigureNotif(MODULE_TYPE)
  }, [mod, onConfigureNotif])

  const handleConfigure = useCallback(() => onConfigure(MODULE_TYPE), [onConfigure])
  const handlePreviewToggle = useCallback(() => onTogglePreview(MODULE_TYPE), [onTogglePreview])
  const handleDataToggle = useCallback(() => onToggleData(MODULE_TYPE), [onToggleData])

  return (
    <div className="module-card-wrapper module-card-wrapper-block">
      <Card
        className="module-card-item"
        header={{
          icon: modIcon,
          title: t('modules.behavioral_activation.label'),
          right: moduleToggle(unlocked, loading, handleToggle),
        }}
        footer={tagChips}
        actions={unlocked && mod ? (
          <ModuleCardFooter
            onConfigureNotif={handleNotif}
            configLabel={t('modules.behavioral_activation.config_button')}
            onConfigure={handleConfigure}
            previewOpen={previewOpen}
            onTogglePreview={handlePreviewToggle}
            dataOpen={dataOpen}
            onToggleData={handleDataToggle}
          />
        ) : undefined}
      >
        <p className="module-card__description">{t('modules.behavioral_activation.description')}</p>
        {unlocked && mod && (
          <div className="module-card__date">
            {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
            {baList.activities.length > 0 && (
              <span className="psycho-observance-summary">
                {' · '}{t('modules.behavioral_activation.config_count', { count: baList.activities.length })}
              </span>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
