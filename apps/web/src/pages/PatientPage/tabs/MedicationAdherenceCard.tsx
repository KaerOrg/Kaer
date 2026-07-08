import { useCallback, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../../components/ui/Card'
import type { ModuleType, PatientModule } from '../../../lib/database.types'
import type { useMedicationListEditor } from '../hooks/useMedicationListEditor'
import { ModuleCardFooter } from './ModuleCardFooter'

const MODULE_TYPE: ModuleType = 'medication_adherence'

type MedList = ReturnType<typeof useMedicationListEditor>

export interface MedicationAdherenceCardProps {
  tagChips: ReactNode
  modIcon: ReactNode
  mod: PatientModule | undefined
  unlocked: boolean
  loading: boolean
  previewOpen: boolean
  dataOpen: boolean
  medList: MedList
  moduleToggle: (on: boolean, loading: boolean, onToggle: () => void) => ReactNode
  onTogglePreview: (type: ModuleType) => void
  onToggleData: (type: ModuleType) => void
  onConfigureNotif: (type: ModuleType) => void
  onConfigure: (type: ModuleType) => void
  onUnlock: (type: ModuleType) => void
  onRevoke: (moduleId: string) => void
}

/**
 * Carte module « Observance du traitement » de l'armoire praticien. L'édition de la
 * liste de médicaments se fait dans l'onglet Configuration de la modale d'actions ; la
 * carte n'affiche que le résumé (nombre de médicaments) et les boutons d'ouverture.
 */
export function MedicationAdherenceCard({
  tagChips, modIcon, mod, unlocked, loading,
  previewOpen, dataOpen, medList, moduleToggle,
  onTogglePreview, onToggleData, onConfigureNotif, onConfigure, onUnlock, onRevoke,
}: MedicationAdherenceCardProps) {
  const { t, i18n } = useTranslation()

  const handleToggle = useCallback(() => {
    if (unlocked && mod) { medList.close(); onRevoke(mod.id) }
    else onUnlock(MODULE_TYPE)
  }, [unlocked, mod, medList, onRevoke, onUnlock])

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
          title: t('modules.medication_adherence.label'),
          right: moduleToggle(unlocked, loading, handleToggle),
        }}
        footer={tagChips}
        actions={unlocked && mod ? (
          <ModuleCardFooter
            onConfigureNotif={handleNotif}
            configLabel={t('modules.medication_adherence.config_button')}
            onConfigure={handleConfigure}
            previewOpen={previewOpen}
            onTogglePreview={handlePreviewToggle}
            dataOpen={dataOpen}
            onToggleData={handleDataToggle}
          />
        ) : undefined}
      >
        <p className="module-card__description">{t('modules.medication_adherence.description')}</p>
        {unlocked && mod && (
          <div className="module-card__date">
            {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
            {medList.medications.length > 0 && (
              <span className="psycho-observance-summary">
                {' · '}{t('modules.medication_adherence.config_count', { count: medList.medications.length })}
              </span>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
