import { describe, it, expect, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { ModuleDataButton } from './ModuleDataButton'

describe('ModuleDataButton', () => {
  it('rend un bouton icône dont le nom accessible est le libellé « Données »', () => {
    render(<ModuleDataButton open={false} onToggle={vi.fn()} />)
    const btn = screen.getByRole('button', { name: 'patient.data_button' })
    expect(btn).toBeTruthy()
    expect(btn.textContent).toBe('')
  })

  it('expose aria-pressed selon l’état ouvert', () => {
    const { rerender } = render(<ModuleDataButton open={false} onToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'patient.data_button' }).getAttribute('aria-pressed')).toBe('false')
    rerender(<ModuleDataButton open onToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'patient.data_button' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('déclenche onToggle au clic', () => {
    const onToggle = vi.fn()
    render(<ModuleDataButton open={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: 'patient.data_button' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
