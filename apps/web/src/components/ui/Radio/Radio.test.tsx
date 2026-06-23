import { render, screen, fireEvent } from '@testing-library/react'
import { Radio } from './Radio'

const OPTIONS = [
  { value: 'a', label: 'Option A', sublabel: 'détail A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
]

describe('Radio', () => {
  describe('variante list (défaut)', () => {
    it('rend une rangée par option avec label et sous-label', () => {
      render(<Radio options={OPTIONS} value="a" onChange={() => {}} />)
      expect(screen.getByText('Option A')).toBeInTheDocument()
      expect(screen.getByText('détail A')).toBeInTheDocument()
      expect(screen.getAllByRole('radio')).toHaveLength(3)
    })

    it('marque l’option sélectionnée via aria-checked', () => {
      render(<Radio options={OPTIONS} value="b" onChange={() => {}} />)
      expect(screen.getByRole('radio', { name: 'Option B' })).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByRole('radio', { name: /Option A/ })).toHaveAttribute('aria-checked', 'false')
    })

    it('appelle onChange avec la valeur cliquée', () => {
      const onChange = vi.fn()
      render(<Radio options={OPTIONS} value={null} onChange={onChange} />)
      fireEvent.click(screen.getByRole('radio', { name: 'Option C' }))
      expect(onChange).toHaveBeenCalledWith('c')
    })
  })

  describe('variante pills', () => {
    it('rend des pilules et marque l’active', () => {
      const { container } = render(<Radio variant="pills" options={OPTIONS} value="a" onChange={() => {}} />)
      expect(container.querySelectorAll('.radio__pill')).toHaveLength(3)
      expect(screen.getByRole('radio', { name: 'Option A' }).className).toContain('radio__pill--active')
    })

    it('appelle onChange au clic sur une pilule', () => {
      const onChange = vi.fn()
      render(<Radio variant="pills" options={OPTIONS} value="a" onChange={onChange} />)
      fireEvent.click(screen.getByRole('radio', { name: 'Option B' }))
      expect(onChange).toHaveBeenCalledWith('b')
    })
  })

  describe('lecture seule (sans onChange)', () => {
    it('rend des pilules en span, sans bouton ni rôle radio', () => {
      const { container } = render(<Radio variant="pills" options={OPTIONS} value="a" />)
      const pills = container.querySelectorAll('.radio__pill')
      expect(pills).toHaveLength(3)
      expect(pills[0].tagName).toBe('SPAN')
      expect(container.querySelectorAll('button')).toHaveLength(0)
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
      expect(screen.queryAllByRole('radio')).toHaveLength(0)
    })

    it('marque toujours l\'option active', () => {
      const { container } = render(<Radio variant="pills" options={OPTIONS} value="a" />)
      expect(container.querySelector('.radio__pill--active')?.textContent).toBe('Option A')
    })
  })

  describe('variante cards', () => {
    const CARDS = [
      { value: '0', label: 'Aucune', sublabel: 'détail 0', badge: '0' },
      { value: '1', label: 'Légère', sublabel: 'détail 1', badge: '1' },
    ]

    it('rend une carte par option avec badge, label et détail', () => {
      const { container } = render(<Radio variant="cards" options={CARDS} value="0" onChange={() => {}} />)
      expect(container.querySelectorAll('.radio__card')).toHaveLength(2)
      expect(container.querySelectorAll('.radio__card-badge')).toHaveLength(2)
      expect(screen.getByText('Aucune')).toBeInTheDocument()
      expect(screen.getByText('détail 1')).toBeInTheDocument()
    })

    it('marque la carte active et émet onChange au clic', () => {
      const onChange = vi.fn()
      render(<Radio variant="cards" options={CARDS} value="0" onChange={onChange} />)
      expect(screen.getByRole('radio', { name: /Aucune/ }).className).toContain('radio__card--active')
      fireEvent.click(screen.getByRole('radio', { name: /Légère/ }))
      expect(onChange).toHaveBeenCalledWith('1')
    })
  })
})
