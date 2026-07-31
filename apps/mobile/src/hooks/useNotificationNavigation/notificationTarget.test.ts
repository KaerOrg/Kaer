import { parseNotificationTarget } from './notificationTarget'

describe('parseNotificationTarget', () => {
  it('ouvre la SAISIE du module par défaut : c\'est ce que le rappel invite à faire', () => {
    expect(parseNotificationTarget({ module_type: 'emotion_wheel' }))
      .toEqual({ moduleType: 'emotion_wheel', screen: 'entry' })
  })

  it('respecte une cible « accueil » explicite', () => {
    expect(parseNotificationTarget({ module_type: 'emotion_wheel', screen: 'home' }))
      .toEqual({ moduleType: 'emotion_wheel', screen: 'home' })
  })

  it('ne va nulle part sans module : mieux vaut rester où on est', () => {
    expect(parseNotificationTarget(null)).toBeNull()
    expect(parseNotificationTarget(undefined)).toBeNull()
    expect(parseNotificationTarget({})).toBeNull()
    expect(parseNotificationTarget({ module_type: '' })).toBeNull()
    expect(parseNotificationTarget({ module_type: 42 })).toBeNull()
  })

  it('ignore une valeur d\'écran inconnue plutôt que de la propager', () => {
    expect(parseNotificationTarget({ module_type: 'm', screen: 'settings' })?.screen).toBe('entry')
  })
})
