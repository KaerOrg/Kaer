import { CLOCK_IDLE, startClock, pauseClock, elapsedMs, elapsedSeconds } from './sessionClock'

describe('sessionClock', () => {
  it('ne compte rien tant qu’elle n’a pas démarré', () => {
    expect(elapsedMs(CLOCK_IDLE, 5_000)).toBe(0)
  })

  it('mesure le segment en cours à l’horloge murale', () => {
    const running = startClock(CLOCK_IDLE, 1_000)
    expect(elapsedMs(running, 4_000)).toBe(3_000)
  })

  it('fige le temps pendant la pause', () => {
    const paused = pauseClock(startClock(CLOCK_IDLE, 1_000), 4_000)
    expect(elapsedMs(paused, 10_000)).toBe(3_000)
  })

  it('cumule les segments successifs sans compter les pauses', () => {
    let state = startClock(CLOCK_IDLE, 0)
    state = pauseClock(state, 5_000)     // 5 s pratiquées
    state = startClock(state, 60_000)    // 55 s de pause, non comptées
    expect(elapsedMs(state, 62_000)).toBe(7_000)
  })

  it('est idempotente : démarrer une horloge qui tourne ne réinitialise rien', () => {
    const running = startClock(CLOCK_IDLE, 1_000)
    expect(startClock(running, 9_000)).toBe(running)
  })

  it('est idempotente : mettre en pause une horloge arrêtée ne change rien', () => {
    expect(pauseClock(CLOCK_IDLE, 9_000)).toBe(CLOCK_IDLE)
  })

  it('ne recule jamais si l’horloge système saute en arrière', () => {
    const running = startClock(CLOCK_IDLE, 10_000)
    expect(elapsedMs(running, 5_000)).toBe(0)
  })

  it('exprime les secondes en valeur continue, pas en ticks entiers', () => {
    const running = startClock(CLOCK_IDLE, 0)
    expect(elapsedSeconds(running, 1_500)).toBe(1.5)
  })
})
