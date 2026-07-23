import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { useTranslation } from 'react-i18next'
import { AppStackParamList, TabParamList } from '../navigation/AppStack'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import type { UnlockedModule, TodayRoutine } from '@services/homeService'
import { homeQueries } from '../hooks/queries'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import { TodaySchedule } from '../components/features/TodaySchedule'
import { CrisisBanner } from '../components/features/CrisisBanner'
import { ModuleSections } from '../components/features/ModuleSections'
import { colors, spacing, fonts } from '@theme'
import { useTeen } from '../hooks/useTeen'
import { EmptyState } from '@ui/EmptyState'

// Modules avec un écran dédié (interaction custom non couverte par le moteur générique).
// Tout module absent de cette map ET avec preview_kind = 'questionnaire' → ScaleHistory.
// Tout module absent de cette map ET autre preview_kind → ModuleContent (moteur générique).
const CUSTOM_ROUTES: Partial<Record<string, keyof AppStackParamList>> = {
  medication_side_effects:  'MedicationSideEffectsHistory',
  mood_tracker:             'MoodTracker',
}

// Navigation composite : l'écran vit dans le Tab navigator (accès à `Profile`) imbriqué
// dans le Stack (accès à `ModuleContent`, `ScaleHistory`…). Évite tout cast.
type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>

// Un module est ouvrable s'il a un écran custom OU si la base ne le marque pas coming_soon.
function isModuleAvailable(mod: UnlockedModule): boolean {
  return CUSTOM_ROUTES[mod.module_type] != null
    || (mod.module != null && mod.module.preview_kind !== 'coming_soon')
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigation>()
  const patient = useAuthStore((s) => s.patient)
  const { t } = useTranslation()
  const { isTeenMode, tg, teenColor } = useTeen()

  const modulesQuery = useQuery(homeQueries.unlockedModules(patient?.id))
  const routinesQuery = useQuery(homeQueries.todayRoutines(patient?.id))
  const modules: UnlockedModule[] = modulesQuery.data ?? []
  const todayRoutines: TodayRoutine[] = routinesQuery.data ?? []
  const loading = modulesQuery.isLoading || routinesQuery.isLoading
  const refreshing = modulesQuery.isRefetching || routinesQuery.isRefetching

  // Dépendre des `refetch` (stables, liés à l'observer TanStack Query) et non des
  // objets query, recréés à chaque rendu.
  const { refetch: refetchModules } = modulesQuery
  const { refetch: refetchRoutines } = routinesQuery
  const handleRefresh = useCallback(() => {
    refetchModules()
    refetchRoutines()
  }, [refetchModules, refetchRoutines])

  // Rafraîchit au retour sur l'écran (déblocage de module ailleurs, etc.).
  useRefreshOnFocus(handleRefresh)

  const handleCrisisPress = useCallback(() => {
    navigation.navigate('ModuleContent', { moduleType: 'crisis_plan' })
  }, [navigation])

  const handleTodayRoutinePress = useCallback((routine: TodayRoutine) => {
    const customRoute = CUSTOM_ROUTES[routine.module_type]
    if (customRoute) {
      navigation.navigate(customRoute as never)
      return
    }
    if (routine.preview_kind === 'questionnaire') {
      navigation.navigate('ScaleHistory', { scale_id: routine.module_type })
      return
    }
    navigation.navigate('ModuleContent', { moduleType: routine.module_type })
  }, [navigation])

  const handleModulePress = useCallback((mod: UnlockedModule) => {
    // 1. Écrans custom dédiés (interaction non couverte par le moteur générique)
    const customRoute = CUSTOM_ROUTES[mod.module_type]
    if (customRoute) {
      navigation.navigate(customRoute as never)
      return
    }
    // 2. Questionnaire sans écran custom → moteur générique ScaleHistory
    if (mod.module?.preview_kind === 'questionnaire' || mod.module?.preview_kind === 'slider_dashboard') {
      navigation.navigate('ScaleHistory', { scale_id: mod.module_type })
      return
    }
    // 3. Tous les autres → moteur générique ModuleContent (DB-driven)
    navigation.navigate('ModuleContent', { moduleType: mod.module_type })
  }, [navigation])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  const hasCrisisPlan = modules.some(m => m.module_type === 'crisis_plan')

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.heading}>{tg('modulesTitle')}</Text>

        {hasCrisisPlan ? <CrisisBanner onPress={handleCrisisPress} /> : null}

        <TodaySchedule
          routines={todayRoutines}
          isTeenMode={isTeenMode}
          teenColor={teenColor}
          onPress={handleTodayRoutinePress}
        />

        {modules.length === 0 ? (
          <EmptyState
            icon="📭"
            title={t('home.empty_title')}
            description={isTeenMode ? t('home.empty_description', { ns: 'teen' }) : t('home.empty_description')}
          />
        ) : (
          <ModuleSections
            modules={modules}
            isTeenMode={isTeenMode}
            teenColor={teenColor}
            isAvailable={isModuleAvailable}
            onModulePress={handleModulePress}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  heading: { fontSize: 40, fontWeight: '700', color: colors.text, fontFamily: fonts.serif },
})
