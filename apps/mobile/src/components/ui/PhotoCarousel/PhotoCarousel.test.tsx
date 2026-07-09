jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { PhotoCarousel } from './PhotoCarousel'

const URIS = ['file://a.jpg', 'file://b.jpg', 'file://c.jpg']

function setup(over: Partial<React.ComponentProps<typeof PhotoCarousel>> = {}) {
  const onClose = jest.fn()
  render(
    <PhotoCarousel
      visible
      uris={URIS}
      initialIndex={0}
      onClose={onClose}
      closeLabel="Fermer"
      prevLabel="Précédent"
      nextLabel="Suivant"
      testID="carousel"
      {...over}
    />,
  )
  return { onClose }
}

describe('PhotoCarousel', () => {
  it('ne rend rien quand la liste est vide', () => {
    const { toJSON } = render(
      <PhotoCarousel visible uris={[]} onClose={jest.fn()} closeLabel="F" prevLabel="P" nextLabel="S" />,
    )
    expect(toJSON()).toBeNull()
  })

  it('affiche l\'indicateur de page et les photos', () => {
    setup()
    expect(screen.getByText('1 / 3')).toBeTruthy()
    expect(screen.getByTestId('carousel-photo-0')).toBeTruthy()
  })

  it('avance et recule via les flèches (indicateur mis à jour)', () => {
    setup()
    fireEvent.press(screen.getByTestId('carousel-next'))
    expect(screen.getByText('2 / 3')).toBeTruthy()
    fireEvent.press(screen.getByTestId('carousel-next'))
    expect(screen.getByText('3 / 3')).toBeTruthy()
    fireEvent.press(screen.getByTestId('carousel-prev'))
    expect(screen.getByText('2 / 3')).toBeTruthy()
  })

  it('borne l\'index : reculer depuis la première photo n\'y change rien', () => {
    setup()
    fireEvent.press(screen.getByTestId('carousel-prev'))
    expect(screen.getByText('1 / 3')).toBeTruthy()
  })

  it('appelle onClose au tap sur le bouton de fermeture', () => {
    const { onClose } = setup()
    fireEvent.press(screen.getByTestId('carousel-close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('n\'affiche pas de flèches ni d\'indicateur avec une seule photo', () => {
    setup({ uris: ['file://only.jpg'] })
    expect(screen.queryByTestId('carousel-prev')).toBeNull()
    expect(screen.queryByTestId('carousel-next')).toBeNull()
  })

  it('ouvre sur l\'index initial fourni', () => {
    setup({ initialIndex: 2 })
    expect(screen.getByText('3 / 3')).toBeTruthy()
  })
})
