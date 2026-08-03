import { vi, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { ScaleEvalBadge } from './ScaleEvalBadge'

describe('ScaleEvalBadge', () => {
  it('rend le badge Auto (auto-évaluation)', () => {
    const { container } = render(<ScaleEvalBadge evaluationType="auto" />)
    expect(screen.getByText('scales.eval_auto')).toBeInTheDocument()
    expect(container.querySelector('.scale-eval-badge--auto')).not.toBeNull()
  })

  it('rend le badge Hétéro (hétéro-évaluation)', () => {
    const { container } = render(<ScaleEvalBadge evaluationType="hetero" />)
    expect(screen.getByText('scales.eval_hetero')).toBeInTheDocument()
    expect(container.querySelector('.scale-eval-badge--hetero')).not.toBeNull()
  })
})
