import React, { useMemo } from 'react'
import { View } from 'react-native'
import { colors } from '@theme'
import { styles } from './SegmentedControl.styles'
import { SegmentButton } from './SegmentButton'
import type { SegmentedControlProps } from './SegmentedControl.types'

/**
 * Interrupteur à choix exclusif : un groupe de segments dont un seul est actif.
 * Couvre les sélecteurs de plage temporelle (7J/1M/3M…), filtres exclusifs et
 * tout choix unique parmi N options visibles côte à côte. Pendant mobile du
 * `SegmentedControl` web.
 *
 * Deux habillages via `variant` : `track` (piste teintée, segments adjacents) et
 * `pills` (pastilles bordées indépendantes). À distinguer de `Radio` (saisie de
 * formulaire, sémantique radio) : ici on bascule une vue/un filtre.
 */
function SegmentedControlInner<T extends string>({
  options, value, onChange, variant = 'track', accentColor, accessibilityLabel, style, testID,
}: SegmentedControlProps<T>) {
  const containerStyle = useMemo(
    () => [variant === 'track' ? styles.track : styles.pills, style],
    [variant, style],
  )
  const segmentStyle = variant === 'track' ? styles.trackSegment : styles.pillSegment
  const active = accentColor ?? colors.primary

  return (
    <View
      style={containerStyle}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {options.map(opt => (
        <SegmentButton
          key={opt.value}
          value={opt.value}
          label={opt.label}
          active={opt.value === value}
          segmentStyle={segmentStyle}
          accentColor={active}
          onSelect={onChange}
        />
      ))}
    </View>
  )
}

// `memo` efface la généricité ; le cast la restaure sans recourir à `any`/`unknown`.
export const SegmentedControl = React.memo(SegmentedControlInner) as typeof SegmentedControlInner

export default SegmentedControl
