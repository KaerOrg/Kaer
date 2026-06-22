import { createRef } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TimePicker } from './TimePicker'

describe('TimePicker', () => {
  it('rend un input type=time avec le libellé', () => {
    render(<TimePicker label="Coucher" value="22:30" onChange={() => {}} data-testid="tp" />)
    expect(screen.getByText('Coucher')).toBeInTheDocument()
    const input = screen.getByTestId('tp')
    expect(input).toHaveAttribute('type', 'time')
    expect(input).toHaveValue('22:30')
  })

  it('émet onChange avec la nouvelle heure (contrôlé)', () => {
    const onChange = vi.fn()
    render(<TimePicker value="08:00" onChange={onChange} data-testid="tp" />)
    fireEvent.change(screen.getByTestId('tp'), { target: { value: '09:15' } })
    expect(onChange).toHaveBeenCalledWith('09:15')
  })

  it('transfère le ref à l’input en mode non contrôlé', () => {
    const ref = createRef<HTMLInputElement>()
    render(<TimePicker defaultValue="07:00" ref={ref} data-testid="tp" />)
    expect(ref.current).toBe(screen.getByTestId('tp'))
    expect(ref.current?.value).toBe('07:00')
  })

  it('affiche la croix quand clearable + valeur, et l’efface', () => {
    const onChange = vi.fn()
    render(<TimePicker value="10:00" onChange={onChange} clearable clearLabel="Effacer" data-testid="tp" />)
    fireEvent.click(screen.getByTestId('tp-clear'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('masque la croix quand aucune valeur', () => {
    render(<TimePicker value="" onChange={() => {}} clearable clearLabel="Effacer" data-testid="tp" />)
    expect(screen.queryByTestId('tp-clear')).toBeNull()
  })

  it('rend un input désactivé en mode aperçu', () => {
    render(<TimePicker defaultValue="22:00" disabled data-testid="tp" />)
    expect(screen.getByTestId('tp')).toBeDisabled()
  })
})
