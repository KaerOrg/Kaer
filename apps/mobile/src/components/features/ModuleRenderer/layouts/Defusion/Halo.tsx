import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, Easing } from 'react-native'
import { radius } from '@theme'

export interface HaloProps {
  /** Couleur du pouls (accent du module ; teinte teen ou primary). */
  color: string
  /** `false` fige le halo (état pause) : la boucle s'arrête sur place. */
  active: boolean
  /** Diamètre de la couche interne. */
  size?: number
  children?: React.ReactNode
}

// Attaque rapide (~120 ms) puis retombée lente : profil de battement à 1 Hz.
const ATTACK_MS = 120
const DECAY_MS = 880
const PULSE_MAX = 1.18

/**
 * Pouls visuel à 1 battement par seconde derrière le mot travaillé. Double couche
 * (halo diffus + anneau) animée en `transform`/`opacity` avec le driver natif
 * (`useNativeDriver: true`) — jamais un `setInterval` pour piloter l'animation :
 * la cadence vient de la boucle Animated native, seule le décompte des secondes
 * (dans le lecteur) reste en JS. Reanimated n'étant pas installé dans l'app, on
 * s'appuie sur l'API `Animated` de React Native avec le driver natif.
 */
export function Halo({ color, active, size = 180, children }: HaloProps) {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!active) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: ATTACK_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: DECAY_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [active, pulse])

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, PULSE_MAX] })
  const outerOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.06] })
  const innerOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0.16] })

  const outer = size * 1.5
  return (
    <View style={[styles.wrap, { width: outer, height: outer }]}>
      <Animated.View
        style={[
          styles.layer,
          { width: outer, height: outer, borderRadius: outer / 2, backgroundColor: color, opacity: outerOpacity, transform: [{ scale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.layer,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: innerOpacity, transform: [{ scale }] },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  layer: { position: 'absolute', borderRadius: radius.full },
  content: { alignItems: 'center', justifyContent: 'center' },
})
