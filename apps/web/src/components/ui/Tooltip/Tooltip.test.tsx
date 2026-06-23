import { render, screen, fireEvent, act } from '@testing-library/react'
import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('rend le déclencheur sans infobulle au repos', () => {
    render(
      <Tooltip label="PHQ-9">
        <span>★</span>
      </Tooltip>
    )
    expect(screen.getByText('★')).toBeInTheDocument()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('affiche l\'infobulle après le délai au survol', () => {
    render(
      <Tooltip label="PHQ-9">
        <span>★</span>
      </Tooltip>
    )
    fireEvent.mouseEnter(screen.getByText('★').parentElement!)
    // Avant le délai : rien.
    expect(screen.queryByRole('tooltip')).toBeNull()
    act(() => vi.advanceTimersByTime(120))
    expect(screen.getByRole('tooltip')).toHaveTextContent('PHQ-9')
  })

  it('masque l\'infobulle quand le survol cesse', () => {
    render(
      <Tooltip label="PHQ-9">
        <span>★</span>
      </Tooltip>
    )
    const trigger = screen.getByText('★').parentElement!
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(120))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.mouseLeave(trigger)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('annule l\'apparition si le survol cesse avant le délai', () => {
    render(
      <Tooltip label="PHQ-9">
        <span>★</span>
      </Tooltip>
    )
    const trigger = screen.getByText('★').parentElement!
    fireEvent.mouseEnter(trigger)
    fireEvent.mouseLeave(trigger)
    act(() => vi.advanceTimersByTime(120))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('affiche aussi l\'infobulle au focus (clavier)', () => {
    render(
      <Tooltip label="PHQ-9">
        <button>★</button>
      </Tooltip>
    )
    fireEvent.focus(screen.getByText('★').parentElement!)
    act(() => vi.advanceTimersByTime(120))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })
})
