import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BREATHING_GOAL_MIN, BREATHING_GOAL_MAX } from '../hooks/useBreathingConfigEditor'

interface Props {
  /** Objectif proposé, en sessions par semaine. `null` = aucune proposition. */
  value: number | null
  onChange: (next: number | null) => void
}

/**
 * Objectif hebdomadaire proposé par le praticien.
 *
 * **En sessions par semaine, jamais en minutes** : c'est la régularité qui est suivie,
 * pas un volume. Et c'est une proposition : le patient l'ajuste librement dans son app,
 * ce que la note sous le champ dit explicitement.
 */
export function BreathingGoalField({ value, onChange }: Props) {
  const { t } = useTranslation()

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    if (raw === '') {
      onChange(null)
      return
    }
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return
    // Borné au `check` de la base : une valeur hors bornes serait refusée à l'écriture.
    onChange(Math.min(BREATHING_GOAL_MAX, Math.max(BREATHING_GOAL_MIN, Math.round(parsed))))
  }, [onChange])

  return (
    <div className="breathing-goal">
      <label className="breathing-goal__label" htmlFor="breathing-goal-input">
        {t('modules.breathing_techniques.config_goal_label')}
      </label>
      <div className="breathing-goal__row">
        <input
          id="breathing-goal-input"
          className="breathing-goal__input"
          type="number"
          inputMode="numeric"
          min={BREATHING_GOAL_MIN}
          max={BREATHING_GOAL_MAX}
          value={value ?? ''}
          onChange={handleChange}
          data-testid="breathing-goal-input"
        />
        <span className="breathing-goal__unit">{t('modules.breathing_techniques.config_goal_unit')}</span>
      </div>
      <p className="breathing-goal__note">{t('modules.breathing_techniques.config_goal_note')}</p>
    </div>
  )
}
