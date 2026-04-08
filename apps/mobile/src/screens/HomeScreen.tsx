import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { AppStackParamList } from '../navigation/AppStack'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { colors, spacing, radius } from '../theme'

// Configuration des modules disponibles dans l'app
const MODULE_CONFIG: Record<
  string,
  { label: string; description: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; available: boolean }
> = {
  sleep_diary: {
    label: 'Agenda du sommeil',
    description: 'Notez votre sommeil chaque matin',
    icon: 'weather-night',
    available: true,
  },
  beck_columns: {
    label: 'Colonnes de Beck',
    description: 'Restructurer les pensées négatives',
    icon: 'brain',
    available: false, // à venir
  },
  fear_thermometer: {
    label: 'Thermomètre de la peur',
    description: 'Mesurer votre niveau d\'anxiété',
    icon: 'thermometer',
    available: false,
  },
  emotion_wheel: {
    label: 'Roue des émotions',
    description: 'Explorer et nommer vos émotions',
    icon: 'palette',
    available: false,
  },
  crisis_plan: {
    label: 'Plan de crise',
    description: 'Plan pour les moments difficiles',
    icon: 'lifebuoy',
    available: false,
  },
  rim: {
    label: 'RIM – Imagerie mentale',
    description: 'Retraitement par l\'imagerie',
    icon: 'waves',
    available: false,
  },
  cognitive_saturation: {
    label: 'Saturation cognitive',
    description: 'Interrompre les ruminations',
    icon: 'chat-processing-outline',
    available: false,
  },
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

  // Recharge les modules à chaque fois que l'écran devient actif
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
    if (moduleType === 'sleep_diary') {
      navigation.navigate('SleepDiary')
    }
    // Les autres modules seront ajoutés progressivement
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
        <Text style={styles.heading}>Mes modules</Text>
        <Text style={styles.subheading}>
          Activés par votre praticien
        </Text>

        {modules.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="inbox-remove-outline" size={52} color={colors.border} />
            <Text style={styles.emptyTitle}>Aucun module disponible</Text>
            <Text style={styles.emptyText}>
              Votre praticien n'a pas encore activé de modules pour vous.{'\n'}
              Ils apparaîtront ici dès qu'il en déverrouille un.
            </Text>
            <Text style={styles.emptyHint}>
              Tirez vers le bas pour actualiser.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {modules.map((mod) => {
              const config = MODULE_CONFIG[mod.module_type]
              if (!config) return null
              return (
                <TouchableOpacity
                  key={mod.id}
                  style={[styles.card, !config.available && styles.cardComingSoon]}
                  onPress={() => config.available && handleModulePress(mod.module_type)}
                  activeOpacity={config.available ? 0.75 : 1}
                >
                  <View style={styles.cardIcon}>
                    <MaterialCommunityIcons name={config.icon} size={30} color={config.available ? colors.primary : colors.textMuted} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{config.label}</Text>
                    <Text style={styles.cardDesc}>{config.description}</Text>
                    {!config.available && (
                      <Text style={styles.comingSoon}>Bientôt disponible</Text>
                    )}
                  </View>
                  {config.available && (
                    <Text style={styles.chevron}>›</Text>
                  )}
                </TouchableOpacity>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardComingSoon: { opacity: 0.55 },
  cardIcon: { width: 42, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  cardDesc: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  comingSoon: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  chevron: { fontSize: 26, color: colors.textMuted, fontWeight: '300' },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyIcon: {},
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyHint: { fontSize: 13, color: colors.border },
})
