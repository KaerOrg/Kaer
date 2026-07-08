import { useCallback, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../../components/ui/Card'
import { ModuleCardFooter } from './ModuleCardFooter'
import type { ModuleType, PatientModule } from '../../../lib/database.types'
import type { useMedicationEffectsEditor } from '../hooks/useMedicationEffectsEditor'

const MODULE_TYPE: ModuleType = 'medication_side_effects'

type MedEffects = ReturnType<typeof useMedicationEffectsEditor>

export interface MedicationSideEffectsCardProps {
  tagChips: ReactNode
  modIcon: ReactNode
  mod: PatientModule | undefined
  unlocked: boolean
  loading: boolean
  previewOpen: boolean
  dataOpen: boolean
  medEffects: MedEffects
  moduleToggle: (on: boolean, loading: boolean, onToggle: () => void) => ReactNode
  onTogglePreview: (type: ModuleType) => void
  onToggleData: (type: ModuleType) => void
  onConfigureNotif: (type: ModuleType) => void
  onConfigure: (type: ModuleType) => void
  onUnlock: (type: ModuleType) => void
  onRevoke: (moduleId: string) => void
}

/**
 * Carte module « Effets indésirables du traitement » de l'armoire praticien.
 * L'édition (sélection des effets suivis) se fait dans l'onglet Configuration de la
 * modale d'actions ; la carte n'affiche que le résumé (nombre d'effets suivis) et les
 * boutons d'ouverture de la modale.
 */
export function MedicationSideEffectsCard({
  tagChips,
  modIcon,
  mod,
  unlocked,
  loading,
  previewOpen,
  dataOpen,
  medEffects,
  moduleToggle,
  onTogglePreview,
  onToggleData,
  onConfigureNotif,
  onConfigure,
  onUnlock,
  onRevoke,
}: MedicationSideEffectsCardProps) {
  const { t, i18n } = useTranslation()

  const handleToggle = useCallback(() => {
    if (unlocked && mod) {
      medEffects.close()
      onRevoke(mod.id)
    } else {
      onUnlock(MODULE_TYPE)
    }
  }, [unlocked, mod, medEffects, onRevoke, onUnlock])

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
          title: t('modules.medication_side_effects.label'),
          right: moduleToggle(unlocked, loading, handleToggle),
        }}
        footer={tagChips}
        actions={unlocked && mod ? (
          <ModuleCardFooter
            onConfigureNotif={handleNotif}
            configLabel={t('modules.medication_side_effects.config_button')}
            onConfigure={handleConfigure}
            previewOpen={previewOpen}
            onTogglePreview={handlePreviewToggle}
            dataOpen={dataOpen}
            onToggleData={handleDataToggle}
          />
        ) : undefined}
      >
        <p className="module-card__description">{t('modules.medication_side_effects.description')}</p>
        {unlocked && mod && (
          <div className="module-card__date">
            {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
            {medEffects.tracked.length > 0 && (
              <span className="psycho-observance-summary">
                {' · '}{t('modules.medication_side_effects.config_tracked_count', { count: medEffects.tracked.length })}
              </span>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
