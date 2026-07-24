import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeDial } from './TimeDial'

function Harness({ onChange, initial = 540 }: { onChange?: (m: number) => void; initial?: number }) {
  const [m, setM] = useState(initial)
  return (
    <TimeDial
      minutes={m}
      onChange={v => { setM(v); onChange?.(v) }}
      title="Rappel à"
      caption="du matin"
      hint="Glissez le repère"
      hoursLabel="Heures"
      minutesLabel="Minutes"
      markerLabel="Repère"
    />
  )
}

describe('TimeDial', () => {
  it('affiche titre, légende, indice et les deux champs initialisés', () => {
    render(<Harness initial={540} />)
    expect(screen.getByText('Rappel à')).toBeInTheDocument()
    expect(screen.getByText('du matin')).toBeInTheDocument()
    expect(screen.getByText('Glissez le repère')).toBeInTheDocument()
    expect(screen.getByLabelText('Heures')).toHaveValue('09')
    expect(screen.getByLabelText('Minutes')).toHaveValue('00')
  })

  it('la saisie des heures met à jour l\'heure et complète à 2 chiffres', () => {
    const spy = vi.fn()
    render(<Harness onChange={spy} initial={540} />)
    const hours = screen.getByLabelText('Heures')
    // « 8 » : premier chiffre > 2 → heure complète (08:00) et passage aux minutes.
    fireEvent.change(hours, { target: { value: '8' } })
    expect(spy).toHaveBeenLastCalledWith(8 * 60)
    expect(screen.getByLabelText('Minutes')).toHaveFocus()
  })

  it('complète le champ à deux chiffres à la perte de focus', () => {
    render(<Harness initial={540} />)
    const minutes = screen.getByLabelText('Minutes')
    fireEvent.change(minutes, { target: { value: '5' } })
    expect(minutes).toHaveValue('5')
    fireEvent.blur(minutes)
    expect(minutes).toHaveValue('05')
  })

  it('la saisie des minutes reste libre (00–59)', () => {
    const spy = vi.fn()
    render(<Harness onChange={spy} initial={540} />)
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '07' } })
    expect(spy).toHaveBeenLastCalledWith(9 * 60 + 7) // 09:07, pas d'aimantation au clavier
  })

  it('borne les valeurs hors plage', () => {
    const spy = vi.fn()
    render(<Harness onChange={spy} initial={540} />)
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '90' } })
    expect(spy).toHaveBeenLastCalledWith(9 * 60 + 59)
  })

  it('expose le repère en slider avec les bons attributs a11y', () => {
    render(<Harness initial={555} />)
    const marker = screen.getByRole('slider', { name: 'Repère' })
    expect(marker).toHaveAttribute('aria-valuenow', '555')
    expect(marker).toHaveAttribute('aria-valuetext', '09:15')
    expect(marker).toHaveAttribute('aria-valuemin', '0')
    expect(marker).toHaveAttribute('aria-valuemax', '1439')
  })

  it('les flèches sur le repère ajustent l\'heure par pas de 15 min', async () => {
    const spy = vi.fn()
    render(<Harness onChange={spy} initial={540} />)
    const marker = screen.getByRole('slider')
    marker.focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(spy).toHaveBeenLastCalledWith(555)
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(spy).toHaveBeenLastCalledWith(525)
  })

  it('l\'arc est un conic-gradient proportionnel à l\'heure', () => {
    const { container } = render(<Harness initial={540} />)
    const ring = container.querySelector('.time-dial__ring') as HTMLElement
    expect(ring.style.background).toContain('conic-gradient')
  })
})
