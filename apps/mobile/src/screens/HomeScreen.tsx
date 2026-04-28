import React, { useEffect, useState, useCallback } from 'react'
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
  psychoeducation:          { icon: 'book-open-page-variant',    available: true  },
  sleep_diary:              { icon: 'weather-night',             available: true  },
  diet_weight_psycho:       { icon: 'food-apple-outline',        available: false },
  chronobiology_tracker:    { icon: 'clock-outline',             available: false },
  mood_tracker:             { icon: 'emoticon-outline',          available: true  },
  emotion_wheel:            { icon: 'palette',                   available: true  },
  behavioral_activation:    { icon: 'run-fast',                  available: true  },
  beck_columns:             { icon: 'brain',                     available: true  },
  cognitive_distortions:    { icon: 'head-cog-outline',          available: false },
  grounding:                { icon: 'hand-heart-outline',        available: true  },
  rim:                      { icon: 'waves',                     available: true  },
  fear_thermometer:         { icon: 'thermometer',               available: true  },
  exposure_hierarchy:       { icon: 'stairs-up',                 available: false },
  breathing_techniques:     { icon: 'lungs',                     available: true  },
  cognitive_saturation:     { icon: 'chat-processing-outline',   available: true  },
  craving_journal:          { icon: 'lightning-bolt-outline',    available: false },
  decisional_balance:       { icon: 'scale-balance',             available: true  },
}

interface UnlockedModule {
  id: string
  module_type: string
  config: Record<string, unknown>
  unlocked_at: string
}

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
    const routes: Partial<Record<string, keyof AppStackParamList>> = {
      sleep_diary:             'SleepDiary',
      crisis_plan:             'CrisisPlan',
      psychoeducation:         'Psychoeducation',
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
    }
    const route = routes[moduleType]
    if (route) {
      navigation.navigate(route as never)
    } else {
      navigation.navigate('ModuleContent', { moduleType })
    }
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
          <View style={styles.list}>
            {modules.map((mod) => {
              const config = MODULE_CONFIG[mod.module_type]
              if (!config) return null
              const accentColor = teenColor(mod.module_type)
              return (
                <Pressable
                  key={mod.id}
                  onPress={() => handleModulePress(mod.module_type)}
                >
                  <Card
                    state={!config.available ? 'disabled' : undefined}
                    accentColor={isTeenMode ? accentColor : undefined}
                  >
                    <View style={styles.cardRow}>
                      <View style={[
                        styles.cardIcon,
                        isTeenMode && accentColor && { backgroundColor: accentColor + '1A', borderRadius: radius.md },
                      ]}>
                        <MaterialCommunityIcons
                          name={config.icon}
                          size={30}
                          color={config.available ? (accentColor ?? colors.primary) : colors.textMuted}
                        />
                      </View>
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{t(`modules.${mod.module_type}.label`)}</Text>
                        <Text style={styles.cardDesc}>{t(`modules.${mod.module_type}.description`)}</Text>
                        {!config.available && (
                          <Text style={styles.comingSoon}>{t('home.coming_soon')}</Text>
                        )}
                      </View>
                      {config.available && (
                        <Text style={[styles.chevron, isTeenMode && accentColor && { color: accentColor }]}>›</Text>
                      )}
                    </View>
                  </Card>
                </Pressable>
              )
            })}
          </View>
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
  list: { gap: spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: { width: 42, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  cardDesc: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  comingSoon: { fontSize: 12, color: colors.primary, fontWeight: '500', marginTop: 4 },
  chevron: { fontSize: 26, color: colors.textMuted, fontWeight: '300' },
})
