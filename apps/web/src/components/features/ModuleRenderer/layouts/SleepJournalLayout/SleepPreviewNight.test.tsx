import type { ReactElement } from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SleepPreviewNight } from './SleepPreviewNight'

const BASE = {
  date: '12 juil.',
  qualityLabel: 'Qualité',
  incompleteLabel: 'Nuit incomplète',
  emptyLabel: 'Pas de saisie',
}

// Un <li> hors <ul> déclenche un warning DOM inoffensif ; on encapsule.
function renderNight(node: ReactElement) {
  return render(<ul>{node}</ul>)
}

describe('SleepPreviewNight (nuit de la Vue patient, miroir mobile)', () => {
  it('variant « filled » : barre fenêtre de sommeil positionnée + horaires + durée', () => {
    const { container } = renderNight(
      <SleepPreviewNight
        {...BASE} variant="filled" quality={4}
        window={{ left: 20, width: 55 }} start="23:00" end="07:00" duration="7 h 30"
      />,
    )
    expect(container.querySelector('.sj-night--filled')).not.toBeNull()
    const segment = container.querySelector<HTMLElement>('.sj-night__segment')
    expect(segment).not.toBeNull()
    expect(segment?.style.left).toBe('20%')
    expect(segment?.style.width).toBe('55%')
    const meta = container.querySelector('.sj-night__meta')?.textContent ?? ''
    expect(meta).toContain('23:00')
    expect(meta).toContain('07:00')
    expect(meta).toContain('7 h 30')
    expect(container.querySelector('.sj-night__muted')).toBeNull()
  })

  it('variant « filled » sans géométrie de fenêtre : pas de barre rendue', () => {
    const { container } = renderNight(
      <SleepPreviewNight {...BASE} variant="filled" quality={3} />,
    )
    expect(container.querySelector('.sj-night__segment')).toBeNull()
    expect(container.querySelector('.sj-night__meta')).toBeNull()
  })

  it('variant « incomplete » : libellé « nuit incomplète », aucune barre ni étoiles', () => {
    const { container, getByText } = renderNight(
      <SleepPreviewNight {...BASE} variant="incomplete" />,
    )
    expect(getByText('Nuit incomplète')).toBeInTheDocument()
    expect(container.querySelector('.sj-night--filled')).toBeNull()
    expect(container.querySelector('.sj-night__segment')).toBeNull()
  })

  it('variant « empty » : libellé « pas de saisie »', () => {
    const { container, getByText } = renderNight(
      <SleepPreviewNight {...BASE} variant="empty" />,
    )
    expect(getByText('Pas de saisie')).toBeInTheDocument()
    expect(container.querySelector('.sj-night__muted')).not.toBeNull()
    expect(container.querySelector('.sj-night--filled')).toBeNull()
  })
})
