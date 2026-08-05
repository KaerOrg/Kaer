import { getSessionAudio, hasAudioAssets, SILENT_AUDIO } from './sessionAudio'

describe('sessionAudio', () => {
  it('rend l’accompagnement silencieux tant que les assets manquent', () => {
    expect(getSessionAudio()).toBe(SILENT_AUDIO)
    expect(hasAudioAssets()).toBe(false)
  })

  it('n’échoue jamais : une session se déroule normalement sans son', () => {
    const audio = getSessionAudio()
    expect(() => {
      audio.startAmbient('river')
      audio.playBreath('inhale', 5)
      audio.stopAmbient()
      audio.stopAll()
    }).not.toThrow()
  })
})
