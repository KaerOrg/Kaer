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

// Configuration des modules disponibles dans l'app.
// RÈGLE : tout ModuleType débloquable côté web doit avoir une entrée ici.
// available: true  = écran implémenté, navigable
// available: false = à venir, affiché grisé sans navigation
const MODULE_CONFIG: Record<
  string,
  { label: string; description: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; available: boolean }
> = {
  // ── Sécurité & Gestion de Crise ───────────────────────────────────────────
  crisis_plan: {
    label: 'Plan de crise',
    description: 'Plan personnalisé pour les moments difficiles',
    icon: 'lifebuoy',
    available: true,
  },
  therapeutic_commitment: {
    label: 'Contrat d\'engagement thérapeutique',
    description: 'Mon engagement à utiliser les ressources d\'urgence',
    icon: 'handshake-outline',
    available: false,
  },
  distress_tolerance: {
    label: 'Tolérance à la détresse',
    description: 'Techniques d\'urgence pour traverser une crise',
    icon: 'shield-half-full',
    available: false,
  },
  // ── Surveillance Iatrogénique & Somatique ─────────────────────────────────
  medication_side_effects: {
    label: 'Effets du traitement',
    description: 'Suivi des effets secondaires (sédation, akathisie…)',
    icon: 'pill',
    available: true,
  },
  medication_adherence: {
    label: 'Observance du traitement',
    description: 'Ai-je pris mon traitement cette semaine ?',
    icon: 'calendar-check-outline',
    available: true,
  },
  psychoeducation: {
    label: 'Psychoéducation',
    description: 'Cartes de savoir sur votre santé mentale',
    icon: 'book-open-page-variant',
    available: true,
  },
  // ── Hygiène de Vie & Rythmes Biologiques ──────────────────────────────────
  sleep_diary: {
    label: 'Agenda du sommeil',
    description: 'Notez votre sommeil chaque matin',
    icon: 'weather-night',
    available: true,
  },
  diet_weight_psycho: {
    label: 'Alimentation & poids',
    description: 'Gérer les fringales liées au traitement',
    icon: 'food-apple-outline',
    available: false,
  },
  chronobiology_tracker: {
    label: 'Régularité chronobiologique',
    description: 'Heure de lever, coucher, premier repas',
    icon: 'clock-outline',
    available: false,
  },
  // ── Régulation Émotionnelle & Humeur ─────────────────────────────────────
  mood_tracker: {
    label: 'Thermomètre de l\'humeur',
    description: 'Suivi quotidien humeur, énergie et anxiété (1–10)',
    icon: 'emoticon-outline',
    available: true,
  },
  emotion_wheel: {
    label: 'Roue des émotions',
    description: 'Explorer et nommer vos émotions',
    icon: 'palette',
    available: false,
  },
  behavioral_activation: {
    label: 'Activation comportementale',
    description: 'Planifier des activités source de plaisir',
    icon: 'run-fast',
    available: true,
  },
  // ── Restructuration Cognitive ─────────────────────────────────────────────
  beck_columns: {
    label: 'Colonnes de Beck',
    description: 'Journal de restructuration cognitive',
    icon: 'brain',
    available: true,
  },
  cognitive_distortions: {
    label: 'Distorsions cognitives',
    description: 'Identifier les pièges de la pensée automatique',
    icon: 'head-cog-outline',
    available: false,
  },
  grounding: {
    label: 'Techniques d\'ancrage',
    description: 'Revenir au présent avec la méthode 5-4-3-2-1',
    icon: 'hand-heart-outline',
    available: false,
  },
  rim: {
    label: 'RIM – Imagerie mentale',
    description: 'Retraitement par l\'imagerie',
    icon: 'waves',
    available: false,
  },
  // ── Anxiété, Phobies & TOC ────────────────────────────────────────────────
  fear_thermometer: {
    label: 'Thermomètre de la peur',
    description: 'Mesurer votre niveau de détresse (SUDs 0–100)',
    icon: 'thermometer',
    available: true,
  },
  exposure_hierarchy: {
    label: 'Hiérarchie d\'exposition',
    description: 'Construire vos paliers d\'exposition graduelle',
    icon: 'stairs-up',
    available: false,
  },
  breathing_techniques: {
    label: 'Techniques de respiration',
    description: 'Cohérence cardiaque, pleine conscience, 4-7-8…',
    icon: 'lungs',
    available: true,
  },
  cognitive_saturation: {
    label: 'Saturation cognitive',
    description: 'Interrompre les ruminations',
    icon: 'chat-processing-outline',
    available: false,
  },
  // ── Addictologie & Impulsivité ────────────────────────────────────────────
  craving_journal: {
    label: 'Journal de craving',
    description: 'Intensité de l\'envie, déclencheur, stratégie',
    icon: 'lightning-bolt-outline',
    available: false,
  },
  decisional_balance: {
    label: 'Balance décisionnelle',
    description: 'Explorer votre ambivalence face au changement',
    icon: 'scale-balance',
    available: true,
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
    const { data, error } = await supabase
      .from('patient_modules')
      .select('*')
      .eq('patient_id', patient.id)
      .order('unlocked_at', { ascending: true })
    console.log('[HomeScreen] patient_id:', patient.id)
    console.log('[HomeScreen] modules from DB:', JSON.stringify(data))
    console.log('[HomeScreen] error:', JSON.stringify(error))
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
    } else if (moduleType === 'crisis_plan') {
      navigation.navigate('CrisisPlan')
    } else if (moduleType === 'psychoeducation') {
      navigation.navigate('Psychoeducation')
    } else if (moduleType === 'decisional_balance') {
      navigation.navigate('DecisionalBalance')
    } else if (moduleType === 'beck_columns') {
      navigation.navigate('BeckColumns')
    } else if (moduleType === 'mood_tracker') {
      navigation.navigate('MoodTracker')
    } else if (moduleType === 'medication_adherence') {
      navigation.navigate('MedicationAdherence')
    } else if (moduleType === 'medication_side_effects') {
      navigation.navigate('MedicationSideEffects')
    } else if (moduleType === 'fear_thermometer') {
      navigation.navigate('FearThermometer')
    } else if (moduleType === 'behavioral_activation') {
      navigation.navigate('BehavioralActivation')
    } else if (moduleType === 'breathing_techniques') {
      navigation.navigate('BreathingTechniques')
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
