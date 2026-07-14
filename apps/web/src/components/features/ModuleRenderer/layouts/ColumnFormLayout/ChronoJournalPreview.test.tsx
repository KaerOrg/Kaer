import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChronoJournalPreview } from './ChronoJournalPreview'
import { CHRONO_ANCHORS } from '../../../../../lib/chronoAnchors'

describe('ChronoJournalPreview', () => {
  it('affiche la légende des 6 repères', () => {
    render(<ChronoJournalPreview />)
    for (const anchor of CHRONO_ANCHORS) {
      // Le libellé (clé i18n renvoyée telle quelle) apparaît dans la légende.
      expect(screen.getAllByText(anchor.labelCode).length).toBeGreaterThan(0)
    }
  })

  it('rend 3 cartes-jour, chacune avec un marqueur par repère (données d’exemple)', () => {
    const { container } = render(<ChronoJournalPreview />)
    expect(container.querySelectorAll('.cj-day')).toHaveLength(3)
    // 6 repères d'exemple renseignés × 3 jours = 18 marqueurs.
    expect(container.querySelectorAll('.cj-frise__marker')).toHaveLength(18)
    // Échelle 0h..24h présente.
    expect(screen.getAllByText('0h').length).toBe(3)
    expect(screen.getAllByText('24h').length).toBe(3)
  })

  it('affiche le CTA quand un libellé est fourni, sinon non', () => {
    const { rerender, container } = render(<ChronoJournalPreview ctaLabel="Noter" />)
    expect(screen.getByText('Noter')).toBeInTheDocument()
    rerender(<ChronoJournalPreview />)
    expect(container.querySelector('button')).toBeNull()
  })
})
