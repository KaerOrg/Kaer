import React, { useState, useCallback } from 'react'
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
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { AppStackParamList } from '../navigation/AppStack'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { colors, spacing, radius } from '../theme'
import { useTeen } from '../hooks/useTeen'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'

const SCALES_TYPES = new Set([
  'phq9', 'gad7', 'epds', 'rcads', 'bsl23', 'cape42', 'audit', 'nsi', 'snap_iv', 'asrs6', 'asrs18',
])

// icon + disponibilité par module. Labels et descriptions viennent de i18n.
const MODULE_CONFIG: Record<
  string,
  { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; available: boolean }
> = {
  crisis_plan:              { icon: 'lifebuoy',                  available: true  },
  therapeutic_commitment:   { icon: 'handshake-outline',         available: false },
  distress_tolerance:       { icon: 'shield-half-full',          available: false },
  medication_side_effects:  { icon: 'pill',                      available: true  },
  medication_adherence:     { icon: 'calendar-check-outline',    available: true  },
  sleep_diary:              { icon: 'weather-night',             available: true  },
  psyedu_sleep:             { icon: 'moon-waning-crescent',      available: true  },
  psyedu_nutrition:         { icon: 'food-apple-outline',        available: true  },
  psyedu_activity:          { icon: 'walk',                      available: true  },
  diet_weight_psycho:       { icon: 'pill',                      available: true  },
  chronobiology_tracker:    { icon: 'clock-outline',             available: true  },
  mood_tracker:             { icon: 'emoticon-outline',          available: true  },
  emotion_wheel:            { icon: 'palette',                   available: true  },
  behavioral_activation:    { icon: 'run-fast',                  available: true  },
  beck_columns:             { icon: 'brain',                     available: true  },
  cognitive_distortions:    { icon: 'head-cog-outline',          available: true  },
  grounding:                { icon: 'hand-heart-outline',        available: true  },
  rim:                      { icon: 'waves',                     available: true  },
  fear_thermometer:         { icon: 'thermometer',               available: true  },
  exposure_hierarchy:       { icon: 'stairs-up',                 available: false },
  breathing_techniques:     { icon: 'lungs',                     available: true  },
  cognitive_saturation:     { icon: 'chat-processing-outline',   available: true  },
  craving_journal:          { icon: 'lightning-bolt-outline',    available: false },
  decisional_balance:       { icon: 'scale-balance',             available: true  },
  phq9:                     { icon: 'clipboard-text-outline',    available: true  },
  gad7:                     { icon: 'clipboard-text-outline',    available: true  },
  epds:                     { icon: 'clipboard-text-outline',    available: true  },
  rcads:                    { icon: 'clipboard-text-outline',    available: true  },
  bsl23:                    { icon: 'clipboard-text-outline',    available: true  },
  cape42:                   { icon: 'clipboard-text-outline',    available: false },
  audit:                    { icon: 'clipboard-text-outline',    available: false },
  nsi:                      { icon: 'clipboard-text-outline',    available: true  },
  snap_iv:                  { icon: 'clipboard-text-outline',    available: true  },
  asrs6:                    { icon: 'clipboard-text-outline',    available: true  },
  asrs18:                   { icon: 'clipboard-text-outline',    available: true  },
}

interface UnlockedModule {
  id: string
  module_type: string
  config: Record<string, unknown>
  unlocked_at: string
}

interface ModuleSectionsProps {
  modules: UnlockedModule[]
  moduleConfig: typeof MODULE_CONFIG
  scalesTypes: Set<string>
  isTeenMode: boolean
  teenColor: (moduleType: string) => string | undefined
  handleModulePress: (moduleType: string) => void
  t: (key: string) => string
}

function ModuleCard({
  mod,
  config,
  isTeenMode,
  accentColor,
  onPress,
  t,
}: {
  mod: UnlockedModule
  config: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; available: boolean }
  isTeenMode: boolean
  accentColor: string | undefined
  onPress: () => void
  t: (key: string) => string
}) {
  return (
    <Pressable
      key={mod.id}
      onPress={config.available ? onPress : undefined}
      disabled={!config.available}
    >
      <Card
        state={!config.available ? 'disabled' : undefined}
        accentColor={isTeenMode ? accentColor : undefined}
      >
        <View style={cardStyles.row}>
          <View style={[
            cardStyles.icon,
            isTeenMode && accentColor && { backgroundColor: accentColor + '1A', borderRadius: radius.md },
          ]}>
            <MaterialCommunityIcons
              name={config.icon}
              size={30}
              color={config.available ? (accentColor ?? colors.primary) : colors.textMuted}
            />
          </View>
          <View style={cardStyles.content}>
            <Text style={cardStyles.title}>{t(`modules.${mod.module_type}.label`)}</Text>
            {Boolean(t(`modules.${mod.module_type}.description`)) && (
              <Text style={cardStyles.desc}>{t(`modules.${mod.module_type}.description`)}</Text>
            )}
            {!config.available && (
              <Text style={cardStyles.comingSoon}>{t('home.coming_soon')}</Text>
            )}
          </View>
          {config.available && (
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

function ModuleSections({ modules, moduleConfig, scalesTypes, isTeenMode, teenColor, handleModulePress, t }: ModuleSectionsProps) {
  const tools = modules.filter(m => !scalesTypes.has(m.module_type))
  const scales = modules.filter(m => scalesTypes.has(m.module_type))

  return (
    <View style={{ gap: spacing.md }}>
      {tools.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          {scales.length > 0 && (
            <Text style={sectionStyles.header}>{t('home.section_tools')}</Text>
          )}
          {tools.map(mod => {
            const config = moduleConfig[mod.module_type]
            if (!config) return null
            return (
              <ModuleCard
                key={mod.id}
                mod={mod}
                config={config}
                isTeenMode={isTeenMode}
                accentColor={teenColor(mod.module_type)}
                onPress={() => handleModulePress(mod.module_type)}
                t={t}
              />
            )
          })}
        </View>
      )}
      {scales.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text style={sectionStyles.header}>{t('home.section_scales')}</Text>
          {scales.map(mod => {
            const config = moduleConfig[mod.module_type]
            if (!config) return null
            return (
              <ModuleCard
                key={mod.id}
                mod={mod}
                config={config}
                isTeenMode={isTeenMode}
                accentColor={teenColor(mod.module_type)}
                onPress={() => handleModulePress(mod.module_type)}
                t={t}
              />
            )
          })}
        </View>
      )}
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
  const [modules, setModules] = useState<UnlockedModule[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchModules = async () => {
    if (!patient) return
    const { data } = await supabase
      .from('patient_modules')
      .select('*')
      .eq('patient_id', patient.id)
      .order('unlocked_at', { ascending: true })
    setModules(data ?? [])
  }

  useFocusEffect(
    useCallback(() => {
      fetchModules().finally(() => setLoading(false))
    }, [patient])
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchModules()
    setRefreshing(false)
  }

  const handleModulePress = (moduleType: string) => {
    const routes: Record<string, keyof AppStackParamList> = {
      sleep_diary:             'SleepDiary',
      crisis_plan:             'CrisisPlan',
      decisional_balance:      'DecisionalBalance',
      beck_columns:            'BeckColumns',
      mood_tracker:            'MoodTracker',
      medication_adherence:    'MedicationAdherence',
      medication_side_effects: 'MedicationSideEffects',
      fear_thermometer:        'FearThermometer',
      behavioral_activation:   'BehavioralActivation',
      breathing_techniques:    'BreathingTechniques',
      rim:                     'Rim',
      grounding:               'Grounding',
      cognitive_saturation:    'CognitiveSaturation',
      emotion_wheel:           'EmotionWheel',
      phq9:                    'PHQ9',
      bsl23:                   'BSL23',
      gad7:                    'GAD7',
      rcads:                   'RCADS25',
      epds:                    'EPDS',
      nsi:                     'NSI',
      snap_iv:                 'SNAPIV',
      asrs6:                   'ASRS6',
      asrs18:                  'ASRS18',
      diet_weight_psycho:      'DietWeightPsycho',
      chronobiology_tracker:   'ChronoBio',
    }
    if (['psyedu_sleep', 'psyedu_nutrition', 'psyedu_activity', 'cognitive_distortions'].includes(moduleType)) {
      navigation.navigate('PsyEduModule', { moduleKey: moduleType })
      return
    }
    const route = routes[moduleType]
    if (route) navigation.navigate(route as never)
  }

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

        {modules.length === 0 ? (
          <EmptyState
            icon="📭"
            title={t('home.empty_title')}
            description={isTeenMode ? t('home.empty_description', { ns: 'teen' }) : t('home.empty_description')}
          />
        ) : (
          <ModuleSections
            modules={modules}
            moduleConfig={MODULE_CONFIG}
            scalesTypes={SCALES_TYPES}
            isTeenMode={isTeenMode}
            teenColor={teenColor}
            handleModulePress={handleModulePress}
            t={t}
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
})
