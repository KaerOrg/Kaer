import React from 'react'
import { Text } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { IconChip } from './IconChip'

function flatten(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]))
}

describe('IconChip', () => {
  it('affiche son contenu (icône)', () => {
    render(<IconChip color="#6dbfc3"><Text>icon</Text></IconChip>)
    expect(screen.getByText('icon')).toBeTruthy()
  })

  it('applique la couleur de fond et la taille par défaut (38)', () => {
    render(<IconChip color="#EF4444" testID="chip"><Text>i</Text></IconChip>)
    const style = flatten(screen.getByTestId('chip').props.style)
    expect(style.backgroundColor).toBe('#EF4444')
    expect(style.width).toBe(38)
    expect(style.height).toBe(38)
  })

  it('applique la taille custom', () => {
    render(<IconChip color="#000" size={44} testID="chip"><Text>i</Text></IconChip>)
    const style = flatten(screen.getByTestId('chip').props.style)
    expect(style.width).toBe(44)
    expect(style.height).toBe(44)
  })
})
