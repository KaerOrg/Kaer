import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { SIDE_EFFECT_CATALOG, isCustomKey } from '../../../lib/sideEffectsCatalog'
import type { useMedicationEffectsEditor } from '../hooks/useMedicationEffectsEditor'
import { SideEffectToggleRow } from './SideEffectToggleRow'
import { CustomEffectRow } from './CustomEffectRow'

type MedEffectsEditor = ReturnType<typeof useMedicationEffectsEditor>

interface Props {
  medEffects: MedEffectsEditor
  /** Ferme la modale d'actions. L'enregistrement est implicite (à chaque bascule/ajout). */
  onClose: () => void
}

/**
 * Onglet Configuration du module Effets indésirables : sélection des effets suivis
 * (catalogue + effets personnalisés). Enregistrement implicite à chaque modification ;
 * « Terminé » ferme la modale.
 */
export function MedicationEffectsConfigPanel({ medEffects, onClose }: Props) {
  const { t } = useTranslation()
  const customRef = useRef<HTMLInputElement>(null)

  const trackedKeys = new Set(medEffects.tracked.map(e => e.key))
  const customs = medEffects.tracked.filter(e => isCustomKey(e.key) || e.custom)

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
    [addCustom],
  )

  return (
    <div className="psycho-card-picker">
      <p className="psycho-card-picker__label">{t('modules.medication_side_effects.config_title')}</p>
      <p className="med-config-hint">{t('modules.medication_side_effects.config_hint')}</p>

      <div className="med-effects-config__toggles">
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
          <p className="med-effects-config__custom-title">
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

      <div className="med-effects-config__add">
        <input
          ref={customRef}
          type="text"
          className="med-effects-config__add-input"
          placeholder={t('modules.medication_side_effects.config_add_placeholder')}
          onKeyDown={handleCustomKeyDown}
        />
        <Button size="sm" variant="ghost" onClick={addCustom}>
          {t('modules.medication_side_effects.config_add')}
        </Button>
      </div>

      <div className="psycho-card-picker__actions med-actions">
        <Button size="sm" loading={medEffects.saving} onClick={onClose}>
          {t('common.done', { defaultValue: 'Terminé' })}
        </Button>
      </div>
    </div>
  )
}
