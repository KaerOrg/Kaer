import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  it('affiche le placeholder', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Rechercher" />)
    expect(screen.getByPlaceholderText('Rechercher')).toBeInTheDocument()
  })

  it('utilise le placeholder comme aria-label par défaut', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Rechercher" />)
    expect(screen.getByLabelText('Rechercher')).toBeInTheDocument()
  })

  it('utilise un aria-label explicite si fourni', () => {
    render(
      <SearchInput
        value=""
        onChange={() => {}}
        placeholder="Rechercher"
        ariaLabel="Filtrer les patients"
      />
    )
    expect(screen.getByLabelText('Filtrer les patients')).toBeInTheDocument()
  })

  it('appelle onChange à chaque frappe', async () => {
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} placeholder="Rechercher" />)
    await userEvent.type(screen.getByRole('searchbox'), 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('affiche la valeur courante', () => {
    render(<SearchInput value="marie" onChange={() => {}} placeholder="Rechercher" />)
    expect(screen.getByRole('searchbox')).toHaveValue('marie')
  })

  it('taille par défaut : pas de modificateur compact', () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} placeholder="Rechercher" />
    )
    expect(container.querySelector('.search-input')).not.toHaveClass('search-input--sm')
  })

  it('applique le modificateur compact quand compact est vrai', () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} placeholder="Rechercher" compact />
    )
    expect(container.querySelector('.search-input')).toHaveClass('search-input--sm')
  })
})
