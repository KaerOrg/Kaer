import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { ClosingAnchors } from './ClosingAnchors'

describe('ClosingAnchors', () => {
  it('rend la grande photo, les petites, et la phrase du patient', () => {
    render(<ClosingAnchors photos={['file://a.jpg', 'file://b.jpg', 'file://c.jpg']} phrase="Ma fille m'attend" />)
    expect(screen.getByTestId('closing-photo-lead')).toBeTruthy()
    expect(screen.getAllByTestId('closing-photo')).toHaveLength(2)
    expect(screen.getByText('Ma fille m\'attend')).toBeTruthy()
  })

  // Pas de guillemets : c'est la phrase du patient, pas une citation.
  it('rend la phrase sans guillemets', () => {
    render(<ClosingAnchors photos={[]} phrase="Ma fille m'attend" />)
    expect(screen.queryByText(/[«»"]/)).toBeNull()
    expect(screen.getByText('Ma fille m\'attend')).toBeTruthy()
  })

  // Section vide : l'écran devient un simple retour, sans texte de manque.
  it('ne rend rien du tout quand il n\'y a ni photo ni phrase', () => {
    render(<ClosingAnchors photos={[]} phrase="" />)
    expect(screen.queryByTestId('closing-photo-lead')).toBeNull()
    expect(screen.queryByTestId('closing-phrase')).toBeNull()
  })

  it('rend la phrase seule quand il n\'y a aucune photo', () => {
    render(<ClosingAnchors photos={[]} phrase="Je tiens pour mon chien" />)
    expect(screen.getByTestId('closing-phrase')).toBeTruthy()
    expect(screen.queryByTestId('closing-photo-lead')).toBeNull()
  })

  it('rend une photo seule quand il n\'y a pas de phrase', () => {
    render(<ClosingAnchors photos={['file://a.jpg']} phrase="" />)
    expect(screen.getByTestId('closing-photo-lead')).toBeTruthy()
    expect(screen.queryByTestId('closing-photo')).toBeNull()
    expect(screen.queryByTestId('closing-phrase')).toBeNull()
  })
})
