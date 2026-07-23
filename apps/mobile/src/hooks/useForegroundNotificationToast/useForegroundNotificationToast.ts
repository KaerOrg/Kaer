import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { useToast } from '../../contexts/ToastContext'

/**
 * Intercepte les notifications push reçues **alors que l'app est au premier plan**
 * et les présente via le Toast in-app plutôt que par la bannière OS (supprimée en
 * foreground par `configureForegroundNotifications`).
 *
 * `addNotificationReceivedListener` ne se déclenche qu'app ouverte : une notif
 * reçue en arrière-plan reste dans le centre de notifications, sans toast.
 *
 * À monter une seule fois, dans un composant situé sous `ToastProvider`.
 */
export function useForegroundNotificationToast(): void {
  const { showToast } = useToast()

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content
      const message = body ?? title
      if (message) showToast(message, 'info')
    })
    return () => subscription.remove()
  }, [showToast])
}
