import { useCallback, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Eye, EyeOff, LineChart, Trash2 } from 'lucide-react'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { Chip } from '@ui/Chip'
import { Tooltip } from '@ui/Tooltip'
import type { ModuleType, PatientModule } from '../../../lib/database.types'
import type { ModuleItem } from '@services/moduleCatalogService'
import type { useBAActivitiesEditor } from '../hooks/useBAActivitiesEditor'
import { BAActivityAddForm } from './BAActivityAddForm'

const MODULE_TYPE: ModuleType = 'behavioral_activation'

type BAList = ReturnType<typeof useBAActivitiesEditor>

export interface BehavioralActivationCardProps {
  tagChips: ReactNode
  modItem: ModuleItem
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
  onConfigureNotif: (args: { patientModuleId: string; moduleLabel: string; moduleIconName: string }) => void
  onUnlock: (type: ModuleType) => void
  onRevoke: (moduleId: string) => void
}

/**
 * Carte module « Activation comportementale » de l'armoire praticien. Héberge
 * l'éditeur des activités co-construites en consultation (domaine de vie +
 * phrase « valeur » du patient, protocole BATD-R). Miroir de
 * MedicationAdherenceCard pour les callbacks stables.
 */
export function BehavioralActivationCard({
  tagChips, modItem, modIcon, mod, unlocked, loading,
  previewOpen, dataOpen, baList, moduleToggle,
  onTogglePreview, onToggleData, onConfigureNotif, onUnlock, onRevoke,
}: BehavioralActivationCardProps) {
  const { t, i18n } = useTranslation()

  // Libellé i18n de chaque domaine, indexé par id de field (lookup O(1) dans la liste).
  const domainLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of baList.domains) map.set(d.id, t(d.textCode))
    return map
  }, [baList.domains, t])

  const handleToggle = useCallback(() => {
    if (unlocked && mod) { baList.close(); onRevoke(mod.id) }
    else onUnlock(MODULE_TYPE)
  }, [unlocked, mod, baList, onRevoke, onUnlock])

  const handleNotif = useCallback(() => {
    if (!mod) return
    onConfigureNotif({
      patientModuleId: mod.id,
      moduleLabel: t('modules.behavioral_activation.label'),
      moduleIconName: modItem.icon,
    })
  }, [mod, onConfigureNotif, t, modItem.icon])

  const handlePreviewToggle = useCallback(() => onTogglePreview(MODULE_TYPE), [onTogglePreview])
  const handleDataToggle = useCallback(() => onToggleData(MODULE_TYPE), [onToggleData])

  // Seul l'éditeur d'activités élargit encore la carte : aperçu et données
  // s'affichent désormais en modale, hors de la grille.
  const isWide = baList.open

  return (
    <div className={`module-card-wrapper module-card-wrapper-block ${isWide ? 'module-card-wrapper-block--wide' : ''}`}>
      <Card
        className="module-card-item"
        header={{
          icon: modIcon,
          title: t('modules.behavioral_activation.label'),
          subtitle: t('modules.behavioral_activation.description'),
          right: moduleToggle(unlocked, loading, handleToggle),
        }}
        actions={unlocked && mod ? (
          <>
            <Tooltip label={t('notifications.configure_button')}>
              <button type="button" className="module-card__notif-btn" aria-label={t('notifications.configure_button')} onClick={handleNotif}>
                <Bell size={14} />
              </button>
            </Tooltip>
            {!baList.open && (
              <Button variant="ghost" size="sm" onClick={baList.openEditor}>
                {t('modules.behavioral_activation.config_button')}
              </Button>
            )}
            <Tooltip label={t('patient.patient_view')}>
              <button
                className={`preview-toggle-btn ${previewOpen ? 'preview-toggle-btn--active' : ''}`}
                onClick={handlePreviewToggle}
              >
                {previewOpen ? <EyeOff size={14} /> : <Eye size={14} />}
                {t('patient.preview_button')}
              </button>
            </Tooltip>
            <Tooltip label={t('patient.data_button')}>
              <button
                type="button"
                className={`preview-toggle-btn ${dataOpen ? 'preview-toggle-btn--active' : ''}`}
                onClick={handleDataToggle}
              >
                <LineChart size={14} />
                {t('patient.data_button')}
              </button>
            </Tooltip>
          </>
        ) : undefined}
      >
        {tagChips}
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

      {baList.open && unlocked && mod && (
        <div className="psycho-card-picker">
          <p className="psycho-card-picker__label">{t('modules.behavioral_activation.config_title')}</p>
          <p className="med-config-hint">{t('modules.behavioral_activation.config_hint')}</p>

          {baList.activities.length === 0 ? (
            <p className="med-empty">{t('modules.behavioral_activation.config_empty')}</p>
          ) : (
            <div className="med-list">
              {baList.activities.map(activity => (
                <div key={activity.id} className="med-row">
                  <div className="med-row__main">
                    <div className="med-row__name">{activity.label}</div>
                    {activity.value_text ? <div className="med-row__poso">{activity.value_text}</div> : null}
                  </div>
                  <Chip
                    label={domainLabelById.get(activity.domain_id) ?? activity.domain_id}
                    tone="neutral"
                    size="sm"
                  />
                  <Tooltip label={t('common.delete')}>
                    <button
                      type="button"
                      className="med-row__remove"
                      aria-label={t('common.delete')}
                      onClick={() => baList.removeActivity(activity.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}

          <BAActivityAddForm domains={baList.domains} onAdd={baList.addActivity} />

          <div className="psycho-card-picker__actions med-actions">
            <Button size="sm" loading={baList.saving} onClick={baList.close}>
              {t('common.done')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
