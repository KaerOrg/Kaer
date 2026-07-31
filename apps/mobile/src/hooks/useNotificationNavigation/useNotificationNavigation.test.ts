import { renderHook, waitFor } from '@testing-library/react-native'
import * as Notifications from 'expo-notifications'
import { useNotificationNavigation } from './useNotificationNavigation'

const mockedGetLast = Notifications.getLastNotificationResponseAsync as jest.Mock
const mockedAddListener = Notifications.addNotificationResponseReceivedListener as jest.Mock

function response(data: Record<string, unknown> | null) {
  return { notification: { request: { content: { data } } } }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockedGetLast.mockResolvedValue(null)
  mockedAddListener.mockReturnValue({ remove: jest.fn() })
})

describe('useNotificationNavigation', () => {
  it('ouvre la SAISIE du module au tap sur un rappel', async () => {
    const openModule = jest.fn()
    const captured: { handler: ((r: unknown) => void) | null } = { handler: null }
    mockedAddListener.mockImplementation((cb: (r: unknown) => void) => {
      captured.handler = cb
      return { remove: jest.fn() }
    })

    renderHook(() => useNotificationNavigation(openModule))
    captured.handler?.(response({ module_type: 'emotion_wheel' }))

    expect(openModule).toHaveBeenCalledWith('emotion_wheel', true)
  })

  it('couvre le cas « app fermée, réveillée par le tap »', async () => {
    const openModule = jest.fn()
    mockedGetLast.mockResolvedValue(response({ module_type: 'emotion_wheel' }))

    renderHook(() => useNotificationNavigation(openModule))

    await waitFor(() => expect(openModule).toHaveBeenCalledWith('emotion_wheel', true))
  })

  it('ne navigue nulle part sans module dans le payload', () => {
    const openModule = jest.fn()
    const captured: { handler: ((r: unknown) => void) | null } = { handler: null }
    mockedAddListener.mockImplementation((cb: (r: unknown) => void) => {
      captured.handler = cb
      return { remove: jest.fn() }
    })

    renderHook(() => useNotificationNavigation(openModule))
    captured.handler?.(response(null))
    captured.handler?.(response({}))

    expect(openModule).not.toHaveBeenCalled()
  })

  it('ne s\'abonne pas tant que la navigation n\'est pas prête', () => {
    renderHook(() => useNotificationNavigation(null))
    expect(mockedAddListener).not.toHaveBeenCalled()
  })

  it('se désabonne au démontage', () => {
    const remove = jest.fn()
    mockedAddListener.mockReturnValue({ remove })
    const { unmount } = renderHook(() => useNotificationNavigation(jest.fn()))
    unmount()
    expect(remove).toHaveBeenCalled()
  })
})
