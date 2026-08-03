import { vi, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { ScaleMetaBadges } from './ScaleMetaBadges'

describe('ScaleMetaBadges', () => {
  it('affiche la description, le badge éval et la catégorie (par défaut)', () => {
    render(<ScaleMetaBadges scaleId="phq9" evaluationType="auto" category="Humeur" />)
    expect(screen.getByText('scales.descriptions.phq9')).toBeInTheDocument()
    expect(screen.getByText('scales.eval_auto')).toBeInTheDocument()
    expect(screen.getByText('scales.category.humeur')).toBeInTheDocument()
  })

  it('rend le badge hétéro pour une échelle hétéro-évaluée', () => {
    render(<ScaleMetaBadges scaleId="madrs" evaluationType="hetero" category="Humeur" />)
    expect(screen.getByText('scales.eval_hetero')).toBeInTheDocument()
  })

  it('omet la description en mode chipsOnly, garde les puces', () => {
    render(<ScaleMetaBadges scaleId="phq9" evaluationType="auto" category="Humeur" chipsOnly />)
    expect(screen.queryByText('scales.descriptions.phq9')).not.toBeInTheDocument()
    expect(screen.getByText('scales.eval_auto')).toBeInTheDocument()
    expect(screen.getByText('scales.category.humeur')).toBeInTheDocument()
  })
})
