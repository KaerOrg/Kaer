import React from 'react'
import { Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ErrorBoundary } from './ErrorBoundary'

const mockReportAppError = jest.fn().mockResolvedValue(undefined)
jest.mock('@services/errorReportingService', () => ({
  reportAppError: (...a: unknown[]) => mockReportAppError(...a),
}))

function Bomb(): React.ReactElement {
  throw new Error('boom')
}

beforeEach(() => {
  mockReportAppError.mockClear()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it("affiche les enfants tant qu'aucune erreur ne survient", () => {
    render(
      <ErrorBoundary>
        <Text>contenu normal</Text>
      </ErrorBoundary>,
    )
    expect(screen.getByText('contenu normal')).toBeTruthy()
    expect(mockReportAppError).not.toHaveBeenCalled()
  })

  it('affiche le fallback et signale le crash quand un enfant lève une exception', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Erreur')).toBeTruthy()
    expect(mockReportAppError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'crash', message: 'boom' }),
    )
  })

  it('« Réessayer » réinitialise l\'état et retente le rendu des enfants', () => {
    let shouldThrow = true
    function MaybeBomb(): React.ReactElement {
      if (shouldThrow) throw new Error('boom')
      return <Text>rétabli</Text>
    }

    render(
      <ErrorBoundary>
        <MaybeBomb />
      </ErrorBoundary>,
    )
    shouldThrow = false
    fireEvent.press(screen.getByText('Réessayer'))
    expect(screen.getByText('rétabli')).toBeTruthy()
  })
})
