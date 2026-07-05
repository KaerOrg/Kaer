import { useCallback, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../../components/ui/Card'
import { ModulePreviewPanel } from '../../../components/features/ModulePreviewPanel'
import { ModuleCardFooter } from './ModuleCardFooter'
import type { ModuleType, PatientModule } from '../../../lib/database.types'
import type { ModuleItem } from '@services/moduleCatalogService'
import { ModuleDataPanel } from './ModuleDataPanel'

const MODULE_TYPE: ModuleType = 'chronobiology_tracker'

export interface ChronobiologyCardProps {
  patientId: string
  tagChips: ReactNode
  modItem: ModuleItem
  modIcon: ReactNode
  mod: PatientModule | undefined
  unlocked: boolean
  loading: boolean
  previewOpen: boolean
  dataOpen: boolean
  moduleToggle: (on: boolean, loading: boolean, onToggle: () => void) => ReactNode
  onTogglePreview: (type: ModuleType) => void
  onToggleData: (type: ModuleType) => void
  onConfigureNotif: (args: { patientModuleId: string; moduleLabel: string; moduleIconName: string }) => void
  onUnlock: (type: ModuleType) => void
  onRevoke: (moduleId: string) => void
}

/**
 * Carte module « Rythmes & régularité » de l'armoire praticien. Toutes les ancres
 * sont suivies en permanence — la saisie patient est optionnelle, une ancre non
 * renseignée n'apparaît simplement pas au bilan. Pas de configuration par patient.
 * Extraite du render de PatientModulesTab pour héberger des callbacks stables.
 */
export function ChronobiologyCard({
  patientId,
  tagChips,
  modItem,
  modIcon,
  mod,
  unlocked,
  loading,
  previewOpen,
  dataOpen,
  moduleToggle,
  onTogglePreview,
  onToggleData,
  onConfigureNotif,
  onUnlock,
  onRevoke,
}: ChronobiologyCardProps) {
  const { t, i18n } = useTranslation()

  const handleToggle = useCallback(() => {
    if (unlocked && mod) onRevoke(mod.id)
    else onUnlock(MODULE_TYPE)
  }, [unlocked, mod, onRevoke, onUnlock])

  const handleNotif = useCallback(() => {
    if (!mod) return
    onConfigureNotif({
      patientModuleId: mod.id,
      moduleLabel: t('modules.chronobiology_tracker.label'),
      moduleIconName: modItem.icon,
    })
  }, [mod, onConfigureNotif, t, modItem.icon])

  const handlePreviewToggle = useCallback(() => onTogglePreview(MODULE_TYPE), [onTogglePreview])
  const handleDataToggle = useCallback(() => onToggleData(MODULE_TYPE), [onToggleData])

  const isWide = previewOpen || dataOpen

  return (
    <div className={`module-card-wrapper module-card-wrapper-block ${isWide ? 'module-card-wrapper-block--wide' : ''}`}>
      <Card
        className="module-card-item"
        header={{
          icon: modIcon,
          title: t('modules.chronobiology_tracker.label'),
          right: moduleToggle(unlocked, loading, handleToggle),
        }}
        footer={tagChips}
        actions={unlocked && mod ? (
          <ModuleCardFooter
            onConfigureNotif={handleNotif}
            previewOpen={previewOpen}
            onTogglePreview={handlePreviewToggle}
            dataOpen={dataOpen}
            onToggleData={handleDataToggle}
          />
        ) : undefined}
      >
        <p className="module-card__description">{t('modules.chronobiology_tracker.description')}</p>
        {unlocked && mod && (
          <div className="module-card__date">
            {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
          </div>
        )}
        {previewOpen && <ModulePreviewPanel moduleType={MODULE_TYPE} color={modItem.color} />}
        {dataOpen && <ModuleDataPanel patientId={patientId} moduleType={MODULE_TYPE} />}
      </Card>
    </div>
  )
}
