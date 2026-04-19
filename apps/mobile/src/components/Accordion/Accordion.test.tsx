import React from 'react'
import { Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Accordion } from './Accordion'

describe('Accordion', () => {
  it('affiche le titre', () => {
    render(<Accordion title="Section"><Text>corps</Text></Accordion>)
    expect(screen.getByText('Section')).toBeTruthy()
  })

  it('est fermé par défaut', () => {
    render(<Accordion title="S"><Text>corps</Text></Accordion>)
    expect(screen.queryByText('corps')).toBeNull()
  })

  it('s'ouvre au clic', () => {
    render(<Accordion title="S"><Text>corps</Text></Accordion>)
    fireEvent.press(screen.getByText('S'))
    expect(screen.getByText('corps')).toBeTruthy()
  })

  it('se referme au second clic', () => {
    render(<Accordion title="S"><Text>corps</Text></Accordion>)
    fireEvent.press(screen.getByText('S'))
    fireEvent.press(screen.getByText('S'))
    expect(screen.queryByText('corps')).toBeNull()
  })

  it('s'ouvre par défaut si defaultOpen=true', () => {
    render(<Accordion title="S" defaultOpen><Text>corps</Text></Accordion>)
    expect(screen.getByText('corps')).toBeTruthy()
  })

  it('affiche le badge si fourni', () => {
    render(<Accordion title="S" badge={5}><Text>c</Text></Accordion>)
    expect(screen.getByText('5')).toBeTruthy()
  })
})
