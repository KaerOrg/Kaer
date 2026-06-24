import { ScrollView } from 'react-native'
import { MonthCalendar, type DayMarker } from '@ui/Chart/TimeRangeCharts'
import { StreakBadge } from './StreakBadge'
import { styles } from './styles'

interface Props {
  dayMarkers: ReadonlyMap<string, DayMarker>
  streakCount: number
  streakLabel: string
  daysLabel: string
  legendLabel: string
  legendItems: ReadonlyArray<{ color: string; label: string }>
  locale: string
  accentColor: string
}

// Onglet calendrier — affichage passif de l'historique : une pastille neutre par
// jour renseigné (couleur du statut déclaré), + la série de jours renseignés.
// Aucune tendance, aucune flèche, aucun taux (MDR 2017/745).
export function CalendarTab({
  dayMarkers, streakCount, streakLabel, daysLabel, legendLabel, legendItems, locale, accentColor,
}: Props) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <StreakBadge count={streakCount} label={streakLabel} />
      <MonthCalendar
        dayMarkers={dayMarkers}
        accentColor={accentColor}
        locale={locale}
        daysLabel={daysLabel}
        legendLabel={legendLabel}
        legendItems={legendItems}
      />
    </ScrollView>
  )
}
