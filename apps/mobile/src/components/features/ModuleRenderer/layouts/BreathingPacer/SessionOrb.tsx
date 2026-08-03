import { memo, useEffect, useMemo, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg'
import type { PhaseType } from '@services/breathingService'
import { SESSION_COLORS, ORB_SIZE, sessionStyles } from './sessionStyles'

export interface SessionOrbProps {
  /** Type de la phase en cours : décide si l'orbe grossit, rétrécit ou se tient. */
  phaseType: PhaseType
  /**
   * Numéro d'instance de la phase. Change à CHAQUE changement de phase, y compris
   * d'un cycle à l'autre : c'est lui qui relance l'animation, pas le décompte.
   */
  phaseInstance: number
  /** Secondes restantes dans la phase, au moment où l'animation (re)démarre. */
  remainingInPhase: number
  /** L'animation tourne. À `false`, l'orbe se fige où elle est. */
  running: boolean
  children?: React.ReactNode
}

/** Échelle de l'orbe en fin d'expiration : elle ne disparaît jamais. */
const MIN_SCALE = 0.82
/** Amplitude de la pulsation pendant une rétention (respiration tenue, pas figée). */
const HOLD_PULSE = 0.02
/** Durée d'un aller-retour de pulsation, en millisecondes. */
const HOLD_PULSE_MS = 1800

/** Échelle cible de chaque type de phase. */
const TARGET_SCALE: Record<PhaseType, number> = {
  inhale: 1,
  hold_in: 1,
  exhale: MIN_SCALE,
  hold_out: MIN_SCALE,
}

const HOLD_PHASES: readonly PhaseType[] = ['hold_in', 'hold_out']

/**
 * L'orbe de la session : elle respire **en continu**, à la cadence de la phase.
 *
 * L'animation vient d'une boucle `Animated` avec driver natif : aucun tick d'une
 * seconde ne pilote sa taille. C'est le défaut exact que la refonte corrige, le
 * cercle précédent avançant par à-coups (epic #195).
 *
 * L'animation est relancée sur le changement d'**instance de phase**, jamais sur le
 * décompte : sinon elle repartirait de zéro à chaque seconde. À la reprise après une
 * pause, elle joue le temps restant de la phase, pas sa durée entière.
 */
export const SessionOrb = memo(function SessionOrb({
  phaseType, phaseInstance, remainingInPhase, running, children,
}: SessionOrbProps) {
  const scale = useRef(new Animated.Value(MIN_SCALE)).current
  // Le temps restant est lu au (re)démarrage de l'animation, sans figurer dans les
  // dépendances de l'effet : il change chaque seconde, et relancerait l'animation.
  const remainingRef = useRef(remainingInPhase)
  remainingRef.current = remainingInPhase

  useEffect(() => {
    if (!running) {
      scale.stopAnimation()
      return
    }
    const target = TARGET_SCALE[phaseType]
    const durationMs = Math.max(1, remainingRef.current) * 1000

    const animation = HOLD_PHASES.includes(phaseType)
      ? Animated.loop(
          Animated.sequence([
            Animated.timing(scale, {
              toValue: target + HOLD_PULSE, duration: HOLD_PULSE_MS / 2,
              easing: Easing.inOut(Easing.sin), useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: target, duration: HOLD_PULSE_MS / 2,
              easing: Easing.inOut(Easing.sin), useNativeDriver: true,
            }),
          ]),
        )
      : Animated.timing(scale, {
          toValue: target, duration: durationMs,
          easing: Easing.inOut(Easing.sin), useNativeDriver: true,
        })

    animation.start()
    return () => animation.stop()
  }, [phaseType, phaseInstance, running, scale])

  const orbStyle = useMemo(() => ({ transform: [{ scale }] }), [scale])

  return (
    <View style={sessionStyles.orbWrap} testID="session-orb">
      <Animated.View style={orbStyle}>
        <Svg width={ORB_SIZE} height={ORB_SIZE}>
          <Defs>
            <RadialGradient id="orbFill" cx="40%" cy="32%" r="75%">
              <Stop offset="0" stopColor={SESSION_COLORS.orbInner} />
              <Stop offset="1" stopColor={SESSION_COLORS.orbOuter} />
            </RadialGradient>
          </Defs>
          {/* Halo : cercles concentriques translucides, faute de flou natif sans
              dépendance supplémentaire. Le rendu reste doux et l'orbe garde son grain. */}
          <Circle cx={ORB_SIZE / 2} cy={ORB_SIZE / 2} r={ORB_SIZE / 2} fill={SESSION_COLORS.glow} opacity={0.18} />
          <Circle cx={ORB_SIZE / 2} cy={ORB_SIZE / 2} r={ORB_SIZE / 2.25} fill={SESSION_COLORS.glow} opacity={0.22} />
          <Circle cx={ORB_SIZE / 2} cy={ORB_SIZE / 2} r={ORB_SIZE / 2.6} fill="url(#orbFill)" />
        </Svg>
      </Animated.View>
      {children}
    </View>
  )
})
