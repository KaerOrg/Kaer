import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from '../navigation/AppStack'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import type { UnlockedModule, TodayRoutine } from '../services/homeService'
import { homeQueries } from '../hooks/queries'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import { TodaySchedule } from '../components/features/TodaySchedule'
import { colors, spacing, radius } from '@theme'
import { useTeen } from '../hooks/useTeen'
import { Card } from '@ui/Card'
import { EmptyState } from '@ui/EmptyState'

// Modules avec un écran dédié (interaction custom non couverte par le moteur générique).
// Tout module absent de cette map ET avec preview_kind = 'questionnaire' → ScaleHistory.
// Tout module absent de cette map ET autre preview_kind → ModuleContent (moteur générique).
const CUSTOM_ROUTES: Partial<Record<string, keyof AppStackParamList>> = {
  breathing_techniques:     'BreathingTechniques',
  medication_side_effects:  'MedicationSideEffectsHistory',
  mood_tracker:             'MoodTracker',
}

// Ordre des catégories — miroir de sort_order dans module_categories en base.
const CATEGORY_ORDER = [
  'safety', 'iatrogenic', 'lifestyle', 'emotion',
  'cognitive', 'anxiety', 'addiction', 'motivation', 'assessments',
]


interface ModuleSectionsProps {
  modules: UnlockedModule[]
  isTeenMode: boolean
  teenColor: (moduleType: string) => string | undefined
  handleModulePress: (mod: UnlockedModule) => void
}

function ModuleCard({
  mod,
  isTeenMode,
  accentColor,
  onPress,
}: {
  mod: UnlockedModule
  isTeenMode: boolean
  accentColor: string | undefined
  onPress: () => void
}) {
  const { t } = useTranslation()
  // Un module est disponible s'il a un écran custom OU si la base ne le marque pas coming_soon
  const available = CUSTOM_ROUTES[mod.module_type] != null
    || (mod.module != null && mod.module.preview_kind !== 'coming_soon')
  const icon = (mod.module?.mobile_icon ?? 'help-circle-outline') as React.ComponentProps<typeof MaterialCommunityIcons>['name']
  return (
    <Pressable
      key={mod.id}
      onPress={available ? onPress : undefined}
      disabled={!available}
    >
      <Card
        state={!available ? 'disabled' : undefined}
        accentColor={isTeenMode ? accentColor : undefined}
      >
        <View style={cardStyles.row}>
          <View style={[
            cardStyles.icon,
            isTeenMode && accentColor && { backgroundColor: accentColor + '1A', borderRadius: radius.md },
          ]}>
            <MaterialCommunityIcons
              name={icon}
              size={30}
              color={available ? (accentColor ?? colors.primary) : colors.textMuted}
            />
          </View>
          <View style={cardStyles.content}>
            <Text style={cardStyles.title}>{t(`modules.${mod.module_type}.label`)}</Text>
            {Boolean(t(`modules.${mod.module_type}.description`)) && (
              <Text style={cardStyles.desc}>{t(`modules.${mod.module_type}.description`)}</Text>
            )}
            {!available && (
              <Text style={cardStyles.comingSoon}>{t('home.coming_soon')}</Text>
            )}
          </View>
          {available && (
            <Text style={[cardStyles.chevron, isTeenMode && accentColor && { color: accentColor }]}>›</Text>
          )}
        </View>
      </Card>
    </Pressable>
  )
}

const cardStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 42, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  desc: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  comingSoon: { fontSize: 12, color: colors.primary, fontWeight: '500', marginTop: 4 },
  chevron: { fontSize: 26, color: colors.textMuted, fontWeight: '300' },
})

function ModuleSections({ modules, isTeenMode, teenColor, handleModulePress }: ModuleSectionsProps) {
  const { t } = useTranslation()
  const grouped = new Map<string, UnlockedModule[]>()
  for (const mod of modules) {
    const catId = mod.module?.category_id ?? 'other'
    if (!grouped.has(catId)) grouped.set(catId, [])
    grouped.get(catId)!.push(mod)
  }

  const sections = [
    ...CATEGORY_ORDER.filter(id => grouped.has(id)).map(id => ({ catId: id, items: grouped.get(id)! })),
    ...[...grouped.entries()].filter(([id]) => !CATEGORY_ORDER.includes(id)).map(([id, items]) => ({ catId: id, items })),
  ]

  const showHeaders = sections.length > 1

  return (
    <View style={{ gap: spacing.md }}>
      {sections.map(({ catId, items }) => (
        <View key={catId} style={{ gap: spacing.sm }}>
          {showHeaders && (
            <Text style={sectionStyles.header}>{t(`category.${catId}.label`)}</Text>
          )}
          {items.map(mod => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              isTeenMode={isTeenMode}
              accentColor={teenColor(mod.module_type)}
              onPress={() => handleModulePress(mod)}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

const sectionStyles = StyleSheet.create({
  header: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.xs,
  },
})

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const patient = useAuthStore((s) => s.patient)
  const { t } = useTranslation()
  const { isTeenMode, tg, teenColor } = useTeen()

  const modulesQuery = useQuery(homeQueries.unlockedModules(patient?.id))
  const routinesQuery = useQuery(homeQueries.todayRoutines(patient?.id))
  const modules: UnlockedModule[] = modulesQuery.data ?? []
  const todayRoutines: TodayRoutine[] = routinesQuery.data ?? []
  const loading = modulesQuery.isLoading || routinesQuery.isLoading
  const refreshing = modulesQuery.isRefetching || routinesQuery.isRefetching

  const handleRefresh = useCallback(() => {
    modulesQuery.refetch()
    routinesQuery.refetch()
  }, [modulesQuery, routinesQuery])

  // Rafraîchit au retour sur l'écran (déblocage de module ailleurs, etc.).
  useRefreshOnFocus(handleRefresh)

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
        <Text style={styles.subheading}>
          {isTeenMode ? t('home.subheading', { ns: 'teen' }) : t('home.subheading')}
        </Text>

        {modules.some(m => m.module_type === 'crisis_plan') && (
          <Pressable
            style={styles.urgencyBtn}
            onPress={() => navigation.navigate('CrisisUrgency')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.urgencyBtnText}>{t('modules.crisis_plan.urgency_title')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
          </Pressable>
        )}

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
            handleModulePress={handleModulePress}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text },
  subheading: { fontSize: 14, color: colors.textMuted, marginTop: -spacing.xs },
  urgencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  urgencyBtnText: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 15 },
})
