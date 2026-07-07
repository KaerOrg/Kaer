import { AppState } from 'react-native'
import { renderHook } from '@testing-library/react-native'
import { useSyncOnForeground } from './useSyncOnForeground'

const mockSync = jest.fn().mockResolvedValue({ synced: 0, failed: 0, skipped: 0 })
jest.mock('@services/sync', () => ({
  RemoteSyncService: { getInstance: () => ({ sync: (...a: unknown[]) => mockSync(...a) }) },
}))

const mockFlushRenderMismatch = jest.fn().mockResolvedValue(undefined)
jest.mock('@services/renderDiagnosticsService', () => ({
  flushRenderMismatchOutbox: (...a: unknown[]) => mockFlushRenderMismatch(...a),
}))

const mockFlushAppError = jest.fn().mockResolvedValue(undefined)
jest.mock('@services/errorReportingService', () => ({
  flushAppErrorOutbox: (...a: unknown[]) => mockFlushAppError(...a),
}))

function triggerAppStateChange(status: 'active' | 'background' | 'inactive'): void {
  const handler = jest.mocked(AppState.addEventListener).mock.calls[0][1]
  handler(status)
}

beforeEach(() => {
  mockSync.mockClear()
  mockFlushRenderMismatch.mockClear()
  mockFlushAppError.mockClear()
  jest.spyOn(AppState, 'addEventListener')
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('useSyncOnForeground', () => {
  it('déclenche la sync distante et les deux flushs de télémétrie au retour foreground', () => {
    renderHook(() => useSyncOnForeground())
    triggerAppStateChange('active')

    expect(mockSync).toHaveBeenCalledTimes(1)
    expect(mockFlushRenderMismatch).toHaveBeenCalledTimes(1)
    expect(mockFlushAppError).toHaveBeenCalledTimes(1)
  })

  it('ne déclenche rien pour un passage en arrière-plan', () => {
    renderHook(() => useSyncOnForeground())
    triggerAppStateChange('background')

    expect(mockSync).not.toHaveBeenCalled()
    expect(mockFlushRenderMismatch).not.toHaveBeenCalled()
    expect(mockFlushAppError).not.toHaveBeenCalled()
  })

  it('retire le listener au démontage', () => {
    const removeSpy = jest.fn()
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: removeSpy })
    const { unmount } = renderHook(() => useSyncOnForeground())
    unmount()
    expect(removeSpy).toHaveBeenCalledTimes(1)
  })
})
