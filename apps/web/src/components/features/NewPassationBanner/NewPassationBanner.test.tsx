import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string | number>) =>
      options == null ? key : `${key}|${Object.values(options).join('|')}`,
  }),
}))

import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { NewPassationBanner } from './NewPassationBanner'

describe('NewPassationBanner', () => {
  it('ne rend rien tant qu\'aucune passation n\'est arrivée', () => {
    const { container } = render(
      <NewPassationBanner count={0} onOpen={vi.fn()} onDismiss={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('annonce l\'arrivée, en accordant le nombre', () => {
    const { container } = render(
      <NewPassationBanner count={2} onOpen={vi.fn()} onDismiss={vi.fn()} />,
    )
    expect(container.textContent).toContain('scales.realtime.new_passation|2')
  })

  it('ouvre les échelles au clic sur « Voir »', () => {
    const onOpen = vi.fn()
    const { getByText } = render(
      <NewPassationBanner count={1} onOpen={onOpen} onDismiss={vi.fn()} />,
    )
    fireEvent.click(getByText('scales.realtime.open'))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('se ferme sans ouvrir quoi que ce soit', () => {
    const onDismiss = vi.fn()
    const onOpen = vi.fn()
    const { getByLabelText } = render(
      <NewPassationBanner count={1} onOpen={onOpen} onDismiss={onDismiss} />,
    )
    fireEvent.click(getByLabelText('common.close'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('MDR : ni score, ni adjectif, ni couleur d\'alerte', () => {
    // Le badge est un FAIT (une passation est arrivée), jamais une interprétation.
    const { container } = render(
      <NewPassationBanner count={1} onOpen={vi.fn()} onDismiss={vi.fn()} />,
    )

    // Variante neutre du design system, jamais `danger` ni `warning`.
    expect(container.querySelector('.banner--info')).not.toBeNull()
    expect(container.querySelector('.banner--danger')).toBeNull()
    expect(container.querySelector('.banner--warning')).toBeNull()
    const text = (container.textContent ?? '').toLowerCase()
    for (const word of ['score', 'sévère', 'élevé', 'urgent', 'alerte', 'risque']) {
      expect(text).not.toContain(word)
    }
  })
})
