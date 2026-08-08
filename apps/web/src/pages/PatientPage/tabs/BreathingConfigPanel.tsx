import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@ui/Button'
import { readBreathingTechniques } from '@kaer/shared'
import { moduleQueries } from '../../../hooks/queries'
import type { useBreathingConfigEditor } from '../hooks/useBreathingConfigEditor'
import { BreathingTechniqueRow } from './BreathingTechniqueRow'
import { BreathingGoalField } from './BreathingGoalField'
import './BreathingConfigPanel.css'

type BreathingEditor = ReturnType<typeof useBreathingConfigEditor>

interface Props {
  breathingConfig: BreathingEditor
  onClose: () => void
}

/**
 * Onglet « Techniques & objectif » du module respiration (W0).
 *
 * **L'activation est le geste clinique du module** : le patient ne voit que les
 * techniques travaillées en séance. Désactiver une technique la retire de son app ;
 * ses sessions passées restent dans les données.
 *
 * L'objectif est en **sessions par semaine**, jamais en minutes, et reste une
 * proposition : le patient l'ajuste librement dans son app.
 *
 * La liste des techniques vient de la base (config-first), pas d'un tableau figé ici.
 */
export function BreathingConfigPanel({ breathingConfig, onClose }: Props) {
  const { t } = useTranslation()
  const { draft, saving, toggleTechnique, setPrimary, setGoal, save } = breathingConfig

  const { data: moduleFields } = useQuery(moduleQueries.fields('breathing_techniques'))
  const techniques = useMemo(
    () => readBreathingTechniques(moduleFields?.fields ?? []),
    [moduleFields],
  )

  const handleSave = useCallback(async () => {
    if (await save()) onClose()
  }, [save, onClose])

  // Rien tant que la config n'est pas lue : un formulaire atteignable avant
  // enregistrerait une activation vide à la place de la vraie.
  if (draft == null) {
    return <p className="breathing-config__loading">{t('common.loading')}</p>
  }

  return (
    <div className="psycho-card-picker">
      <p className="psycho-card-picker__label">{t('modules.breathing_techniques.config_title')}</p>
      <p className="med-config-hint">{t('modules.breathing_techniques.config_hint')}</p>

      <div className="breathing-config__techniques">
        {techniques.map(technique => (
          <BreathingTechniqueRow
            key={technique.key}
            technique={technique}
            enabled={draft.enabledTechniques.includes(technique.key)}
            isPrimary={draft.primaryTechnique === technique.key}
            onToggle={toggleTechnique}
            onSetPrimary={setPrimary}
          />
        ))}
      </div>

      <BreathingGoalField value={draft.weeklyGoalSessions} onChange={setGoal} />

      <div className="psycho-card-picker__actions">
        <Button variant="ghost" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
        <Button size="sm" loading={saving} onClick={handleSave}>{t('common.save')}</Button>
      </div>
    </div>
  )
}
