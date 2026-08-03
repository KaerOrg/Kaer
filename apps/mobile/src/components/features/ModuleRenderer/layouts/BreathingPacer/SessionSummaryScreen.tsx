import { useCallback, useMemo, useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Card } from '@ui/Card'
import { Button } from '@ui/Button'
import { Radio, type RadioOption } from '@ui/Radio'
import { colors } from '@theme'
import type { BreathingFeeling } from '@services/breathingService'
import { SummaryStat } from './SummaryStat'
import { formatClock } from './sessionPhases'
import { summaryStyles } from './summaryStyles'
import type { LabelFn } from './types'
import type { SessionResult } from './BreathingSessionScreen'

export interface SessionSummaryScreenProps {
  /** La session qui vient de se terminer, menée au bout ou interrompue. */
  result: SessionResult
  /** Nom de la technique, déjà traduit. */
  techniqueName: string
  /** Jours consécutifs de pratique, compte brut. */
  streak: number
  lbl: LabelFn
  /**
   * Clôt l'écran. `feeling` vaut `null` quand le patient passe : la session reste
   * enregistrée telle quelle, sans qu'un refus soit noté nulle part.
   */
  onClose: (feeling: BreathingFeeling | null) => void
}

/** Les trois ressentis possibles, dans l'ordre d'affichage. */
const FEELINGS: readonly BreathingFeeling[] = ['calmer', 'same', 'tenser']

const CHECK_SIZE = 32

/**
 * Clôture de session : ce qui vient d'être fait, puis un ressenti facultatif.
 *
 * **Conformité MDR 2017/745, à relire avant toute modification de cet écran.** Le
 * ressenti est **un mot, pas une mesure** : il est stocké brut et restitué brut.
 * Sont interdits sans exception, ici comme partout ailleurs dans le module :
 * toute note chiffrée du ressenti, tout score, toute moyenne, toute pondération ;
 * toute courbe de tendance ou corrélation avec la technique ou la durée ; tout
 * texte du type « efficace pour vous » ou « votre meilleure technique ».
 *
 * Les trois choix portent **la même couleur d'accent**. Une teinte par ressenti
 * (vert « plus calme », orange « plus tendu ») serait un codage de valence sur une
 * donnée clinique, que la règle d'or interdit explicitement, y compris statique.
 *
 * L'encart de régularité est un **texte fixe**, jamais dérivé des données du patient :
 * il ne commente pas la session qui vient d'avoir lieu.
 */
export function SessionSummaryScreen({
  result, techniqueName, streak, lbl, onClose,
}: SessionSummaryScreenProps) {
  const [feeling, setFeeling] = useState<BreathingFeeling | null>(null)

  const options = useMemo<RadioOption[]>(
    () => FEELINGS.map(key => ({ value: key, label: lbl(`feeling_${key}`) })),
    [lbl],
  )

  const handleChange = useCallback((value: string) => {
    setFeeling(FEELINGS.find(key => key === value) ?? null)
  }, [])
  const handleSave = useCallback(() => onClose(feeling), [onClose, feeling])
  const handleSkip = useCallback(() => onClose(null), [onClose])

  return (
    <SafeAreaView style={summaryStyles.screen} edges={SAFE_EDGES} testID="breathing-summary">
      <ScrollView contentContainerStyle={summaryStyles.content}>
        <View style={summaryStyles.header}>
          <View style={summaryStyles.checkCircle}>
            <MaterialCommunityIcons name="check" size={CHECK_SIZE} color={colors.primaryDark} />
          </View>
          <Text style={summaryStyles.title}>{lbl('summary_title')}</Text>
          <Text style={summaryStyles.technique}>{techniqueName}</Text>
        </View>

        <View style={summaryStyles.stats}>
          <SummaryStat
            value={formatClock(result.durationSeconds)}
            label={lbl('summary_stat_duration')}
            testID="summary-duration"
          />
          <SummaryStat
            value={String(result.cyclesCompleted)}
            label={lbl('summary_stat_cycles')}
            testID="summary-cycles"
          />
          <SummaryStat
            value={String(streak)}
            label={lbl('summary_stat_streak')}
            testID="summary-streak"
          />
        </View>

        <Card variant="elevated" testID="breathing-feeling-card">
          <Text style={summaryStyles.feelingTitle}>{lbl('summary_feeling_title')}</Text>
          <Radio
            options={options}
            value={feeling}
            onChange={handleChange}
            variant="pills"
            testID="breathing-feeling"
          />
          <Text style={summaryStyles.feelingNote}>{lbl('summary_feeling_note')}</Text>
        </Card>

        <View style={summaryStyles.callout}>
          <Text style={summaryStyles.calloutText}>{lbl('summary_regularity')}</Text>
        </View>

        <View style={summaryStyles.actions}>
          <Button
            label={lbl('summary_save')}
            onPress={handleSave}
            accessibilityLabel={lbl('summary_save')}
            testID="breathing-summary-save"
          />
          <Button
            variant="ghost"
            size="sm"
            label={lbl('summary_skip')}
            onPress={handleSkip}
            accessibilityLabel={lbl('summary_skip')}
            testID="breathing-summary-skip"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const SAFE_EDGES = ['top', 'bottom'] as const
