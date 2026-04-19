import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('affiche le label', () => {
    render(<StatusBadge label="Actif" />)
    expect(screen.getByText('Actif')).toBeTruthy()
  })

  it('affiche la valeur si fournie', () => {
    render(<StatusBadge label="Score" value={42} />)
    expect(screen.getByText('42')).toBeTruthy()
  })

  it("n'affiche pas la valeur si absente", () => {
    render(<StatusBadge label="L" />)
    expect(screen.queryByText('42')).toBeNull()
  })

  it('affiche l'icône si fournie', () => {
    render(<StatusBadge label="L" icon="⚠️" />)
    expect(screen.getByText('⚠️')).toBeTruthy()
  })

  it('applique les bonnes couleurs pour chaque variante', () => {
    const variants = ['info', 'success', 'warning', 'danger', 'neutral'] as const
    variants.forEach(variant => {
      const { unmount } = render(<StatusBadge label="L" variant={variant} />)
      expect(screen.getByText('L')).toBeTruthy()
      unmount()
    })
  })
})
