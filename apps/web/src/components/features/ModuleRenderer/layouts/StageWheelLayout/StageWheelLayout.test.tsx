import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StageWheelLayout } from './StageWheelLayout'

// `t` déterministe : renvoie la clé i18n telle quelle.
const t = (key: string) => key

describe('StageWheelLayout (web preview)', () => {
  it('rend titre, sous-titre et 6 stades dérivés du moduleId', () => {
    render(<StageWheelLayout moduleId="motivational_balance" t={t} />)
    expect(screen.getByText('modules.motivational_balance.stage_title')).toBeInTheDocument()
    expect(screen.getByText('modules.motivational_balance.stage_subtitle')).toBeInTheDocument()
    expect(screen.getByText('modules.motivational_balance.stage_1')).toBeInTheDocument()
    expect(screen.getByText('modules.motivational_balance.stage_6')).toBeInTheDocument()
    expect(screen.queryByText('modules.motivational_balance.stage_7')).not.toBeInTheDocument()
  })

  it('rend le bouton enregistrer désactivé', () => {
    render(<StageWheelLayout moduleId="motivational_balance" t={t} />)
    const btn = screen.getByRole('button', { name: 'modules.motivational_balance.rulers_save' })
    expect(btn).toBeDisabled()
  })
})
