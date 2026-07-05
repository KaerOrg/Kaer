import { describe, it, expect, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { render, screen } from '@testing-library/react'
import { ModuleCardFooter } from './ModuleCardFooter'

describe('ModuleCardFooter', () => {
  it('ne rend un bouton que si son handler est fourni', () => {
    render(<ModuleCardFooter previewOpen={false} onTogglePreview={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'patient.preview_button' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'patient.data_button' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'notifications.configure_button' })).toBeNull()
  })

  it('ne rend pas la roue crantée si le libellé est fourni mais pas le handler', () => {
    render(<ModuleCardFooter configLabel="Configurer le plan" onTogglePreview={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Configurer le plan' })).toBeNull()
  })

  it('applique l’ordre canonique : cloche, config, aperçu, données, extra', () => {
    render(
      <ModuleCardFooter
        onConfigureNotif={vi.fn()}
        configLabel="Configurer le traitement"
        onConfigure={vi.fn()}
        previewOpen={false}
        onTogglePreview={vi.fn()}
        dataOpen={false}
        onToggleData={vi.fn()}
        extra={<button type="button">extra-action</button>}
      />
    )
    const names = screen.getAllByRole('button').map(b => b.getAttribute('aria-label') ?? b.textContent)
    expect(names).toEqual([
      'notifications.configure_button',
      'Configurer le traitement',
      'patient.preview_button',
      'patient.data_button',
      'extra-action',
    ])
  })
})
