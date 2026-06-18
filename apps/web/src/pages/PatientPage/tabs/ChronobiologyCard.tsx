import { useCallback, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Eye, EyeOff, LineChart } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ModulePreviewPanel } from '../../../components/features/ModulePreviewPanel'
import type { ModuleType, PatientModule } from '../../../lib/database.types'
import type { ModuleItem } from '../../../services/moduleCatalogService'
import { ModuleDataPanel } from './ModuleDataPanel'
import type { useChronoAnchorsEditor } from '../hooks/useChronoAnchorsEditor'
import { AnchorToggleRow } from './AnchorToggleRow'

const MODULE_TYPE: ModuleType = 'chronobiology_tracker'

type ChronoAnchors = ReturnType<typeof useChronoAnchorsEditor>

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
  anchors: ChronoAnchors
  moduleToggle: (on: boolean, loading: boolean, onToggle: () => void) => ReactNode
  onTogglePreview: (type: ModuleType) => void
  onToggleData: (type: ModuleType) => void
  onConfigureNotif: (args: { patientModuleId: string; moduleLabel: string; moduleIconName: string }) => void
  onUnlock: (type: ModuleType) => void
  onRevoke: (moduleId: string) => void
}

/**
 * Carte module « Rythmes & régularité » de l'armoire praticien. Héberge l'éditeur
 * des ancres suivies par patient (catalogue lu en base, sélection dans
 * patient_modules.config.anchors). Extraite du render de PatientModulesTab pour
 * héberger des callbacks stables (un branchement de render ne peut pas appeler de hooks).
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
  anchors,
  moduleToggle,
  onTogglePreview,
  onToggleData,
  onConfigureNotif,
  onUnlock,
  onRevoke,
}: ChronobiologyCardProps) {
  const { t, i18n } = useTranslation()

  const handleToggle = useCallback(() => {
    if (unlocked && mod) {
      anchors.close()
      onRevoke(mod.id)
    } else {
      onUnlock(MODULE_TYPE)
    }
  }, [unlocked, mod, anchors, onRevoke, onUnlock])

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

  const isWide = anchors.open || previewOpen || dataOpen

  return (
    <div className={`module-card-wrapper module-card-wrapper-block ${isWide ? 'module-card-wrapper-block--wide' : ''}`}>
      <Card
        className="module-card-item"
        header={{
          icon: modIcon,
          title: t('modules.chronobiology_tracker.label'),
          subtitle: t('modules.chronobiology_tracker.description'),
          right: moduleToggle(unlocked, loading, handleToggle),
        }}
        actions={unlocked && mod ? (
          <>
            <Button
              variant="outline"
              size="xs"
              icon={<Bell size={14} />}
              aria-label={t('notifications.configure_button')}
              title={t('notifications.configure_button')}
              onClick={handleNotif}
            />
            {!anchors.open && (
              <Button variant="ghost" size="sm" onClick={anchors.openEditor}>
                {t('modules.chronobiology_tracker.config_button')}
              </Button>
            )}
            <Button
              variant="outline"
              size="xs"
              aria-pressed={previewOpen}
              icon={previewOpen ? <EyeOff size={14} /> : <Eye size={14} />}
              onClick={handlePreviewToggle}
              title={t('patient.patient_view')}
            >
              {t('patient.preview_button')}
            </Button>
            <Button
              variant="outline"
              size="xs"
              aria-pressed={dataOpen}
              icon={<LineChart size={14} />}
              onClick={handleDataToggle}
              title={t('patient.data_button')}
            >
              {t('patient.data_button')}
            </Button>
          </>
        ) : undefined}
      >
        {tagChips}
        {unlocked && mod && (
          <div className="module-card__date">
            {t('patient.unlocked_on', { date: new Date(mod.unlocked_at).toLocaleDateString(i18n.language) })}
            {anchors.selected.length > 0 && (
              <span className="psycho-observance-summary">
                {' · '}{t('modules.chronobiology_tracker.config_anchor_count', { count: anchors.selected.length })}
              </span>
            )}
          </div>
        )}
        {previewOpen && <ModulePreviewPanel moduleType={MODULE_TYPE} color={modItem.color} />}
        {dataOpen && <ModuleDataPanel patientId={patientId} moduleType={MODULE_TYPE} />}
      </Card>

      {anchors.open && unlocked && mod && (
        <div className="psycho-card-picker">
          <p className="psycho-card-picker__label">{t('modules.chronobiology_tracker.config_title')}</p>
          <p className="chrono-config-hint">{t('modules.chronobiology_tracker.config_hint')}</p>

          <div className="chrono-config-list">
            {anchors.catalog.map(anchor => (
              <AnchorToggleRow
                key={anchor.key}
                anchorKey={anchor.key}
                checked={anchors.isSelected(anchor.key)}
                label={t(anchor.textCode)}
                onToggle={anchors.toggle}
              />
            ))}
          </div>

          <div className="psycho-card-picker__actions" style={CHRONO_ACTIONS_STYLE}>
            <Button size="sm" loading={anchors.saving} onClick={anchors.close}>
              {t('common.done', { defaultValue: 'Terminé' })}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const CHRONO_ACTIONS_STYLE = { marginTop: 16 } as const
