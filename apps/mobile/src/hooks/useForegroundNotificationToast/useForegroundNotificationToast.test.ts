import { renderHook } from '@testing-library/react-native'
import * as Notifications from 'expo-notifications'
import { useForegroundNotificationToast } from './useForegroundNotificationToast'

jest.mock('expo-notifications')

const mockShowToast = jest.fn()
jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

type ReceivedListener = Parameters<typeof Notifications.addNotificationReceivedListener>[0]

/** Récupère le callback passé à addNotificationReceivedListener sur le dernier montage. */
function getListener(): ReceivedListener {
  const calls = jest.mocked(Notifications.addNotificationReceivedListener).mock.calls
  return calls[calls.length - 1][0]
}

function makeNotification(title: string | null, body: string | null) {
  return { request: { content: { title, body } } } as Parameters<ReceivedListener>[0]
}

beforeEach(() => jest.clearAllMocks())

describe('useForegroundNotificationToast', () => {
  it('affiche un toast info avec le corps de la notification reçue au premier plan', () => {
    renderHook(() => useForegroundNotificationToast())
    getListener()(makeNotification('Kær', 'Vous avez un exercice à faire aujourd\'hui.'))

    expect(mockShowToast).toHaveBeenCalledTimes(1)
    expect(mockShowToast).toHaveBeenCalledWith('Vous avez un exercice à faire aujourd\'hui.', 'info')
  })

  it('retombe sur le titre quand le corps est absent', () => {
    renderHook(() => useForegroundNotificationToast())
    getListener()(makeNotification('Kær', null))

    expect(mockShowToast).toHaveBeenCalledWith('Kær', 'info')
  })

  it('n\'affiche aucun toast si titre et corps sont absents', () => {
    renderHook(() => useForegroundNotificationToast())
    getListener()(makeNotification(null, null))

    expect(mockShowToast).not.toHaveBeenCalled()
  })

  it('retire l\'abonnement au démontage', () => {
    const remove = jest.fn()
    jest.mocked(Notifications.addNotificationReceivedListener).mockReturnValueOnce({ remove } as never)

    const { unmount } = renderHook(() => useForegroundNotificationToast())
    unmount()

    expect(remove).toHaveBeenCalledTimes(1)
  })
})
