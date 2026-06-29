import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DualRulerLayout } from './DualRulerLayout'

const t = (key: string) => key

describe('DualRulerLayout (web preview)', () => {
  it('rend les deux échelles importance / confiance', () => {
    render(<DualRulerLayout moduleId="motivational_balance" t={t} />)
    expect(screen.getByText('modules.motivational_balance.rulers_title')).toBeInTheDocument()
    expect(screen.getByText('modules.motivational_balance.rulers_importance')).toBeInTheDocument()
    expect(screen.getByText('modules.motivational_balance.rulers_confidence')).toBeInTheDocument()
  })

  it('rend le bouton enregistrer désactivé', () => {
    render(<DualRulerLayout moduleId="motivational_balance" t={t} />)
    const btn = screen.getByRole('button', { name: 'modules.motivational_balance.rulers_save' })
    expect(btn).toBeDisabled()
  })
})
