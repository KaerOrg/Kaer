import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { Toggle } from '../../../components/ui/Toggle/Toggle'
import { formatRhythm, type BreathingTechniqueSpec } from '@kaer/shared'

interface Props {
  technique: BreathingTechniqueSpec
  enabled: boolean
  isPrimary: boolean
  onToggle: (key: string) => void
  onSetPrimary: (key: string) => void
}

/**
 * Une technique dans l'onglet « Techniques & objectif » : sa bascule d'activation,
 * son nom, son rythme, et le badge « en séance ».
 *
 * Le badge n'est cliquable que sur une technique activée : désigner comme travaillée
 * en séance une technique que le patient ne voit pas n'aurait pas de sens.
 */
export function BreathingTechniqueRow({ technique, enabled, isPrimary, onToggle, onSetPrimary }: Props) {
  const { t } = useTranslation()

  const handleToggle = useCallback(() => onToggle(technique.key), [onToggle, technique.key])
  const handleSetPrimary = useCallback(() => onSetPrimary(technique.key), [onSetPrimary, technique.key])

  const name = t(`modules.breathing_techniques.${technique.key}_name`)

  return (
    <div className="breathing-technique-row">
      <Toggle
        label={name}
        checked={enabled}
        onChange={handleToggle}
      />
      <span className="breathing-technique-row__rhythm">{formatRhythm(technique.phases)}</span>
      {isPrimary ? (
        <span className="breathing-technique-row__badge" data-testid={`breathing-primary-${technique.key}`}>
          {t('modules.breathing_techniques.config_in_session')}
        </span>
      ) : enabled ? (
        <Button
          variant="ghost"
          size="xs"
          onClick={handleSetPrimary}
          data-testid={`breathing-set-primary-${technique.key}`}
        >
          {t('modules.breathing_techniques.config_set_in_session')}
        </Button>
      ) : null}
    </div>
  )
}
