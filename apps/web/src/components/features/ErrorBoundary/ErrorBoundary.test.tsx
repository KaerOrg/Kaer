import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'

const mockReportAppError = vi.fn()
vi.mock('@services/errorReportingService', () => ({
  reportAppError: (...a: unknown[]) => mockReportAppError(...a),
  normalizeRoute: (pathname: string) => pathname,
}))

function Bomb(): never {
  throw new Error('boom')
}

beforeEach(() => {
  mockReportAppError.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('affiche les enfants tant qu\'aucune erreur ne survient', () => {
    render(
      <ErrorBoundary>
        <p>contenu normal</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('contenu normal')).toBeInTheDocument()
    expect(mockReportAppError).not.toHaveBeenCalled()
  })

  it('affiche le fallback et signale le crash quand un enfant lève une exception', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Une erreur est survenue.')).toBeInTheDocument()
    expect(mockReportAppError).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'crash', message: 'boom' }),
    )
  })

  it('le bouton de rechargement recharge la page', async () => {
    const reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', { value: { ...window.location, reload: reloadSpy }, writable: true })

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    await userEvent.click(screen.getByText('Recharger la page'))
    expect(reloadSpy).toHaveBeenCalledOnce()
  })
})
