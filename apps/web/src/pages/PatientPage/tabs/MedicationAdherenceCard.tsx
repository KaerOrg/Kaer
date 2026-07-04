import { useCallback, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Tooltip } from '../../../components/ui/Tooltip'
import { ModulePreviewPanel } from '../../../components/features/ModulePreviewPanel'
import type { ModuleType, PatientModule } from '../../../lib/database.types'
import type { ModuleItem } from '@services/moduleCatalogService'
import { ModuleDataPanel } from './ModuleDataPanel'
import type { useMedicationListEditor } from '../hooks/useMedicationListEditor'
import { MedicationAddForm } from './MedicationAddForm'
import { ModuleCardFooter } from './ModuleCardFooter'

const MODULE_TYPE: ModuleType = 'medication_adherence'

type MedList = ReturnType<typeof useMedicationListEditor>

export interface MedicationAdherenceCardProps {
  patientId: string
  tagChips: ReactNode
  modItem: ModuleItem
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
  onConfigureNotif: (args: { patientModuleId: string; moduleLabel: string; moduleIconName: string }) => void
  onUnlock: (type: ModuleType) => void
  onRevoke: (moduleId: string) => void
}

/**
 * Carte module « Observance du traitement » de l'armoire praticien. Héberge
 * l'éditeur de la liste de médicaments (co-éditée avec le patient). Extraite du
 * render de PatientModulesTab pour héberger des callbacks stables (useCallback).
 */
export function MedicationAdherenceCard({
  patientId, tagChips, modItem, modIcon, mod, unlocked, loading,
  previewOpen, dataOpen, medList, moduleToggle,
  onTogglePreview, onToggleData, onConfigureNotif, onUnlock, onRevoke,
}: MedicationAdherenceCardProps) {
  const { t, i18n } = useTranslation()

  const handleToggle = useCallback(() => {
    if (unlocked && mod) { medList.close(); onRevoke(mod.id) }
    else onUnlock(MODULE_TYPE)
  }, [unlocked, mod, medList, onRevoke, onUnlock])

  const handleNotif = useCallback(() => {
    if (!mod) return
    onConfigureNotif({
      patientModuleId: mod.id,
      moduleLabel: t('modules.medication_adherence.label'),
      moduleIconName: modItem.icon,
    })
  }, [mod, onConfigureNotif, t, modItem.icon])

  const handlePreviewToggle = useCallback(() => onTogglePreview(MODULE_TYPE), [onTogglePreview])
  const handleDataToggle = useCallback(() => onToggleData(MODULE_TYPE), [onToggleData])

  const isWide = medList.open || previewOpen || dataOpen

  return (
    <div className={`module-card-wrapper module-card-wrapper-block ${isWide ? 'module-card-wrapper-block--wide' : ''}`}>
      <Card
        className="module-card-item"
        header={{
          icon: modIcon,
          title: t('modules.medication_adherence.label'),
          subtitle: t('modules.medication_adherence.description'),
          right: moduleToggle(unlocked, loading, handleToggle),
        }}
        actions={unlocked && mod ? (
          <ModuleCardFooter
            onConfigureNotif={handleNotif}
            configLabel={t('modules.medication_adherence.config_button')}
            onConfigure={!medList.open ? medList.openEditor : undefined}
            previewOpen={previewOpen}
            onTogglePreview={handlePreviewToggle}
            dataOpen={dataOpen}
            onToggleData={handleDataToggle}
          />
        ) : undefined}
      >
        {tagChips}
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
        {previewOpen && <ModulePreviewPanel moduleType={MODULE_TYPE} color={modItem.color} />}
        {dataOpen && <ModuleDataPanel patientId={patientId} moduleType={MODULE_TYPE} />}
      </Card>

      {medList.open && unlocked && mod && (
        <div className="psycho-card-picker">
          <p className="psycho-card-picker__label">{t('modules.medication_adherence.config_title')}</p>
          <p className="med-config-hint">{t('modules.medication_adherence.config_hint')}</p>

          {medList.medications.length === 0 ? (
            <p className="med-empty">{t('modules.medication_adherence.meds_empty')}</p>
          ) : (
            <div className="med-list">
              {medList.medications.map(med => (
                <div key={med.id} className="med-row">
                  <div className="med-row__main">
                    <div className="med-row__name">{med.name}</div>
                    {med.posology ? <div className="med-row__poso">{med.posology}</div> : null}
                  </div>
                  <Chip
                    label={t(`modules.medication_adherence.${med.kind === 'prn' ? 'kind_prn' : 'kind_maintenance'}`)}
                    tone="neutral"
                    size="sm"
                  />
                  <Tooltip label={t('common.delete')}>
                    <button
                      type="button"
                      className="med-row__remove"
                      aria-label={t('common.delete')}
                      onClick={() => medList.removeMedication(med.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}

          <MedicationAddForm onAdd={medList.addMedication} />

          <div className="psycho-card-picker__actions med-actions">
            <Button size="sm" loading={medList.saving} onClick={medList.close}>
              {t('common.done')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
