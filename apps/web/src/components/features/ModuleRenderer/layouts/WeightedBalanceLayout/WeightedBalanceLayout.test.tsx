import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WeightedBalanceLayout } from './WeightedBalanceLayout'
import type { ContentField } from '@services/moduleService'

const t = (key: string) => key

function configField(props: Record<string, string>): ContentField {
  return {
    id: 'mb.balance.cfg', module_id: 'motivational_balance', section_id: null,
    parent_field_id: null, text_code: null, sort_order: 0, props, children: [],
    field_type: 'weighted_balance_config',
  }
}

describe('WeightedBalanceLayout (web preview)', () => {
  it('rend les chips de valeurs depuis la config indexée', () => {
    render(
      <WeightedBalanceLayout
        fields={[configField({ value_1: 'family', value_2: 'health', value_3: 'work' })]}
        moduleId="motivational_balance"
        t={t}
      />
    )
    expect(screen.getByText('modules.motivational_balance.values_family')).toBeInTheDocument()
    expect(screen.getByText('modules.motivational_balance.values_work')).toBeInTheDocument()
  })

  it('rend les deux colonnes Pour / Contre', () => {
    render(
      <WeightedBalanceLayout
        fields={[configField({ value_1: 'family' })]}
        moduleId="motivational_balance"
        t={t}
      />
    )
    expect(screen.getByText('modules.motivational_balance.balance_for')).toBeInTheDocument()
    expect(screen.getByText('modules.motivational_balance.balance_against')).toBeInTheDocument()
  })

  it('sans config, ne rend aucune chip mais garde les colonnes', () => {
    render(<WeightedBalanceLayout fields={[]} moduleId="motivational_balance" t={t} />)
    expect(screen.queryByText('modules.motivational_balance.values_family')).not.toBeInTheDocument()
    expect(screen.getByText('modules.motivational_balance.balance_for')).toBeInTheDocument()
  })
})
