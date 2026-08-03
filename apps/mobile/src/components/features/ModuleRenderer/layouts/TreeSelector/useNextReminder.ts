import { useCallback, useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../../../../../navigation/AppStack'
import { useAuthStore } from '../../../../../store/authStore'
import { getPatientModuleRef, getRoutinesForModule } from '@services/notificationService'

// Prochain rappel du module, pour la ligne de l'accueil (#257 · #251).
//
// L'accueil affiche « Prochain rappel : 18:00 » et un bouton qui ouvre l'écran des
// rappels. La ligne ne parle QUE d'horaire : elle ne commente jamais ce que le patient
// a saisi, et n'apparaît pas s'il n'a aucun rappel actif (MDR).

/** Heure du prochain rappel actif, format « HH:MM ». `null` si aucun. */
export function useNextReminder(moduleId: string): {
  time: string | null
  openReminders: () => void
} {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const patient = useAuthStore(s => s.patient)
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!patient) return
      const ref = await getPatientModuleRef(patient.id, moduleId)
      if (!ref) return
      const routines = await getRoutinesForModule(ref.id)
      if (cancelled) return
      // La plus proche dans la journée, parmi les rappels actifs et non mis en pause.
      const times = routines
        .filter(r => r.is_active && !r.patient_paused)
        .map(r => r.patient_time_override ?? r.time_of_day)
        .sort()
      setTime(times[0] ?? null)
    }
    void load().catch(() => { /* la ligne reste masquée : rien à dire au patient */ })
    return () => { cancelled = true }
  }, [patient, moduleId])

  const openReminders = useCallback(
    () => navigation.navigate('ModuleReminders', { moduleType: moduleId }),
    [navigation, moduleId],
  )

  return { time, openReminders }
}
