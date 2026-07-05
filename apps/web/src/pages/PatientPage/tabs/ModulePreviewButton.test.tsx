import { describe, it, expect, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { ModulePreviewButton } from './ModulePreviewButton'

describe('ModulePreviewButton', () => {
  it('rend un bouton icône dont le nom accessible est le libellé « Aperçu »', () => {
    render(<ModulePreviewButton open={false} onToggle={vi.fn()} />)
    const btn = screen.getByRole('button', { name: 'patient.preview_button' })
    expect(btn).toBeTruthy()
    // icône seule : pas de texte visible
    expect(btn.textContent).toBe('')
  })

  it('expose aria-pressed selon l’état ouvert', () => {
    const { rerender } = render(<ModulePreviewButton open={false} onToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'patient.preview_button' }).getAttribute('aria-pressed')).toBe('false')
    rerender(<ModulePreviewButton open onToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'patient.preview_button' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('déclenche onToggle au clic', () => {
    const onToggle = vi.fn()
    render(<ModulePreviewButton open={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: 'patient.preview_button' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
