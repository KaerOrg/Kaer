import { useCallback, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ModulePreviewPanel } from '../../../components/features/ModulePreviewPanel'
import { ModuleCardFooter } from './ModuleCardFooter'
import { SIDE_EFFECT_CATALOG, isCustomKey } from '../../../lib/sideEffectsCatalog'
import type { ModuleType, PatientModule } from '../../../lib/database.types'
import type { ModuleItem } from '@services/moduleCatalogService'
import { ModuleDataPanel } from './ModuleDataPanel'
import type { useMedicationEffectsEditor } from '../hooks/useMedicationEffectsEditor'
import { SideEffectToggleRow } from './SideEffectToggleRow'
import { CustomEffectRow } from './CustomEffectRow'

const MODULE_TYPE: ModuleType = 'medication_side_effects'

type MedEffects = ReturnType<typeof useMedicationEffectsEditor>

export interface MedicationSideEffectsCardProps {
  patientId: string
  tagChips: ReactNode
  modItem: ModuleItem
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
  onConfigureNotif: (args: { patientModuleId: string; moduleLabel: string; moduleIconName: string }) => void
  onUnlock: (type: ModuleType) => void
  onRevoke: (moduleId: string) => void
}

/**
 * Carte module « Effets indésirables du traitement » de l'armoire praticien.
 * Extraite du `renderModuleCard` de PatientModulesTab pour pouvoir héberger des
 * callbacks stables (useCallback) — un branchement de render ne peut pas appeler de hooks.
 */
export function MedicationSideEffectsCard({
  patientId,
  tagChips,
  modItem,
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
  onUnlock,
  onRevoke,
}: MedicationSideEffectsCardProps) {
  const { t, i18n } = useTranslation()
  const customRef = useRef<HTMLInputElement>(null)

  const trackedKeys = new Set(medEffects.tracked.map(e => e.key))
  const customs = medEffects.tracked.filter(e => isCustomKey(e.key) || e.custom)

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
    onConfigureNotif({
      patientModuleId: mod.id,
      moduleLabel: t('modules.medication_side_effects.label'),
      moduleIconName: modItem.icon,
    })
  }, [mod, onConfigureNotif, t, modItem.icon])

  const handlePreviewToggle = useCallback(() => onTogglePreview(MODULE_TYPE), [onTogglePreview])
  const handleDataToggle = useCallback(() => onToggleData(MODULE_TYPE), [onToggleData])

  const addCustom = useCallback(() => {
    if (customRef.current) {
      medEffects.addCustom(customRef.current.value)
      customRef.current.value = ''
    }
  }, [medEffects])

  const handleCustomKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') addCustom()
    },
    [addCustom]
  )

  const isWide = medEffects.open || previewOpen || dataOpen

  return (
    <div className={`module-card-wrapper module-card-wrapper-block ${isWide ? 'module-card-wrapper-block--wide' : ''}`}>
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
            onConfigure={!medEffects.open ? medEffects.openEditor : undefined}
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
        {previewOpen && <ModulePreviewPanel moduleType={MODULE_TYPE} color={modItem.color} />}
        {dataOpen && <ModuleDataPanel patientId={patientId} moduleType={MODULE_TYPE} />}
      </Card>

      {medEffects.open && unlocked && mod && (
        <div className="psycho-card-picker">
          <p className="psycho-card-picker__label">{t('modules.medication_side_effects.config_title')}</p>
          <p style={{ fontSize: 12, color: '#6B7280', marginTop: -8, marginBottom: 12 }}>
            {t('modules.medication_side_effects.config_hint')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SIDE_EFFECT_CATALOG.map(cat => (
              <SideEffectToggleRow
                key={cat.key}
                item={cat}
                checked={trackedKeys.has(cat.key)}
                label={t(`modules.medication_side_effects.${cat.labelKey}`)}
                onToggle={medEffects.toggleFixed}
              />
            ))}

            {customs.length > 0 && (
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '12px 0 4px' }}>
                {t('modules.medication_side_effects.config_custom_title')}
              </p>
            )}
            {customs.map(e => (
              <CustomEffectRow
                key={e.key}
                effect={e}
                deleteLabel={t('common.delete')}
                onRemove={medEffects.removeEffect}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
            <input
              ref={customRef}
              type="text"
              placeholder={t('modules.medication_side_effects.config_add_placeholder')}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
              onKeyDown={handleCustomKeyDown}
            />
            <Button size="sm" variant="ghost" onClick={addCustom}>
              {t('modules.medication_side_effects.config_add')}
            </Button>
          </div>

          <div className="psycho-card-picker__actions" style={{ marginTop: 16 }}>
            <Button size="sm" loading={medEffects.saving} onClick={medEffects.close}>
              {t('common.done', { defaultValue: 'Terminé' })}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
