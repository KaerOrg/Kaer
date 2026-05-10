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
import { fetchUnlockedModules, type UnlockedModule } from '../services/homeService'
import { colors, spacing, radius } from '../theme'
import { useTeen } from '../hooks/useTeen'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'

// Modules avec un écran dédié (interaction custom non couverte par le moteur générique).
// Tout module absent de cette map ET avec preview_kind = 'questionnaire' → ScaleHistory.
// Tout module absent de cette map ET autre preview_kind → ModuleContent (moteur générique).
const CUSTOM_ROUTES: Partial<Record<string, keyof AppStackParamList>> = {
  psychoeducation:          'Psychoeducation',
  breathing_techniques:     'BreathingTechniques',
}


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
  const tools = modules.filter(m => m.module?.preview_kind !== 'questionnaire')
  const scales = modules.filter(m => m.module?.preview_kind === 'questionnaire')

  return (
    <View style={{ gap: spacing.md }}>
      {tools.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          {scales.length > 0 && (
            <Text style={sectionStyles.header}>{t('home.section_tools')}</Text>
          )}
          {tools.map(mod => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              isTeenMode={isTeenMode}
              accentColor={teenColor(mod.module_type)}
              onPress={() => handleModulePress(mod)}
            />
          ))}
        </View>
      )}
      {scales.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text style={sectionStyles.header}>{t('home.section_scales')}</Text>
          {scales.map(mod => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              isTeenMode={isTeenMode}
              accentColor={teenColor(mod.module_type)}
              onPress={() => handleModulePress(mod)}
            />
          ))}
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
    setModules(await fetchUnlockedModules(patient.id))
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

  const handleModulePress = useCallback((mod: UnlockedModule) => {
    // 1. Écrans custom dédiés (interaction non couverte par le moteur générique)
    const customRoute = CUSTOM_ROUTES[mod.module_type]
    if (customRoute) {
      navigation.navigate(customRoute as never)
      return
    }
    // 2. Questionnaire sans écran custom → moteur générique ScaleHistory
    if (mod.module?.preview_kind === 'questionnaire') {
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
})
