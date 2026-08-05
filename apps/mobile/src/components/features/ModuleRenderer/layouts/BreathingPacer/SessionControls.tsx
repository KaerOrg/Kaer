import { memo } from 'react'
import { View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button } from '@ui/Button'
import { SESSION_COLORS, sessionStyles } from './sessionStyles'

export interface SessionControlsProps {
  running: boolean
  /** Le son est coupé. `null` = aucun son disponible, le bouton n'est pas rendu. */
  muted: boolean | null
  onToggleSound: () => void
  onTogglePause: () => void
  onStop: () => void
  /** Libellés accessibles, i18n résolue par l'appelant. */
  soundLabel: string
  pauseLabel: string
  stopLabel: string
}

const ICON_SIZE = 24
const ICON_SIZE_LARGE = 30

/**
 * Commandes de session : son, pause / reprise, arrêt anticipé.
 *
 * Le bouton son n'est rendu que si un accompagnement sonore est réellement
 * disponible : proposer de couper un silence n'aurait aucun sens.
 */
export const SessionControls = memo(function SessionControls({
  running, muted, onToggleSound, onTogglePause, onStop, soundLabel, pauseLabel, stopLabel,
}: SessionControlsProps) {
  return (
    <View style={sessionStyles.controls}>
      {muted !== null ? (
        <Button
          variant="ghost"
          onPress={onToggleSound}
          style={sessionStyles.controlBtn}
          accessibilityLabel={soundLabel}
          testID="session-sound"
          iconLeft={
            <MaterialCommunityIcons
              name={muted ? 'volume-off' : 'volume-high'}
              size={ICON_SIZE}
              color={SESSION_COLORS.text}
            />
          }
        />
      ) : null}

      <Button
        variant="ghost"
        onPress={onTogglePause}
        style={sessionStyles.controlBtnLarge}
        accessibilityLabel={pauseLabel}
        testID="session-pause"
        iconLeft={
          <MaterialCommunityIcons
            name={running ? 'pause' : 'play'}
            size={ICON_SIZE_LARGE}
            color={SESSION_COLORS.text}
          />
        }
      />

      <Button
        variant="ghost"
        onPress={onStop}
        style={sessionStyles.controlBtn}
        accessibilityLabel={stopLabel}
        testID="session-stop"
        iconLeft={<MaterialCommunityIcons name="close" size={ICON_SIZE} color={SESSION_COLORS.text} />}
      />
    </View>
  )
})
