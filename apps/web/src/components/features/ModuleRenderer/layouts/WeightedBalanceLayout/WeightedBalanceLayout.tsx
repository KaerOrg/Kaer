import { Plus } from 'lucide-react'
import { collectIndexed } from '@kaer/shared'
import { Button } from '@ui/Button'
import { Chip } from '@ui/Chip'
import type { ContentField } from '../../../../../services/moduleService'

// Aperçu praticien (« Vue patient ») du motif `weighted_balance` : sélection de
// valeurs (chips) + balance Pour/Contre. Statique ; les vraies saisies patient
// sont servies par l'onglet « Données ». La liste des valeurs provient du field
// `weighted_balance_config` (clés indexées `value_1..`), les libellés du moduleId.
// MDR : pondération subjective du patient, aucune interprétation.
const SAMPLE_SELECTED = 2

interface Props {
  fields: ContentField[]
  moduleId: string
  t: (key: string) => string
}

export function WeightedBalanceLayout({ fields, moduleId, t }: Props) {
  const lbl = (key: string): string => t(`modules.${moduleId}.${key}`)
  const config = fields.find(f => f.field_type === 'weighted_balance_config')
  const valueKeys = config ? collectIndexed(config.props, 'value') : []

  return (
    <div className="mb-preview">
      <span className="mb-preview__title">{lbl('balance_values_title')}</span>
      <span className="mb-preview__subtitle">{lbl('balance_values_subtitle')}</span>

      {valueKeys.length > 0 && (
        <div className="mb-chips">
          {valueKeys.map((key, i) => (
            <Chip
              key={key}
              label={lbl(`values_${key}`)}
              selectable
              selected={i < SAMPLE_SELECTED}
            />
          ))}
        </div>
      )}

      <Button type="button" variant="secondary" disabled>
        {lbl('balance_values_save')}
      </Button>

      <div className="mb-balance">
        {(['for', 'against'] as const).map(side => (
          <div key={side} className="mb-block">
            <span className={`mb-block__title mb-block__title--${side}`}>
              {lbl(side === 'for' ? 'balance_for' : 'balance_against')}
            </span>
            <span className="mb-block__empty">{lbl('balance_no_items')}</span>
            <div className="mb-add">
              <div className="mb-input mb-add__input" data-placeholder={lbl('balance_item_placeholder')} />
              <span className="mb-add__btn" aria-hidden="true"><Plus size={16} /></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
