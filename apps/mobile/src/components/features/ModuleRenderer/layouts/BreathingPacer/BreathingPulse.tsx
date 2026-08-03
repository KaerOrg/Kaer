import { memo, useEffect, useMemo, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { radius } from '@theme'

export interface BreathingPulseProps {
  /** Couleur de la technique : halo et cœur en sont dérivés par transparence. */
  color: string
  /** Durée de la phase d'inspiration, en secondes (le cœur grossit). */
  inhaleSeconds: number
  /** Durée totale d'un cycle, en secondes (le reste sert à la décrue). */
  cycleSeconds: number
  /** Diamètre extérieur du halo. Défaut : 72. */
  size?: number
  testID?: string
}

/** Échelle minimale du cœur (fin d'expiration) : il ne disparaît jamais. */
const MIN_SCALE = 0.82

/**
 * Pastille qui respire en boucle, à la cadence de la technique. Repère visuel du
 * hub : elle donne le tempo avant même de lancer la session.
 *
 * L'animation vient d'une boucle `Animated` avec driver natif, jamais d'un
 * `setInterval` : une pastille pilotée par un tick d'une seconde avance par
 * à-coups (c'est le défaut que la refonte corrige, cf. epic #195).
 */
export const BreathingPulse = memo(function BreathingPulse({
  color, inhaleSeconds, cycleSeconds, size = 72, testID,
}: BreathingPulseProps) {
  const progress = useRef(new Animated.Value(0)).current

  // Une expiration au moins aussi longue qu'une seconde : une technique mal
  // configurée (cycle = inspiration) ne doit pas produire une durée nulle, qui
  // ferait tourner la boucle Animated à vide.
  const inhaleMs = Math.max(1, inhaleSeconds) * 1000
  const exhaleMs = Math.max(1, cycleSeconds - inhaleSeconds) * 1000

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1, duration: inhaleMs, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0, duration: exhaleMs, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [progress, inhaleMs, exhaleMs])

  const scale = useMemo(
    () => progress.interpolate({ inputRange: [0, 1], outputRange: [MIN_SCALE, 1] }),
    [progress],
  )
  const haloStyle = useMemo(
    () => [styles.halo, { width: size, height: size, backgroundColor: `${color}22` }],
    [size, color],
  )
  const coreStyle = useMemo(
    () => [
      styles.core,
      { width: size * 0.42, height: size * 0.42, backgroundColor: color, transform: [{ scale }] },
    ],
    [size, color, scale],
  )

  return (
    <View style={haloStyle} testID={testID}>
      <Animated.View style={coreStyle} />
    </View>
  )
})

const styles = StyleSheet.create({
  halo: { borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  core: { borderRadius: radius.full },
})
