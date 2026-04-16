import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { colors, spacing, radius } from '../../theme'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RimConfig {
  alternative_scenario: string
  original_scenario?: string
}

// ─── Consignes du protocole IRT ───────────────────────────────────────────────
//
// Référence : Krakow & Zadra (2006), Image Rehearsal Therapy pour les cauchemars
// en contexte PTSD. Grade A (méta-analyse Casement & Swanson, 2012, Sleep Med Rev).
//
// Ces consignes sont génériques et non-interprétatives (conformité MDR 2017/745).
// L'interprétation et l'adaptation appartiennent exclusivement au praticien.

const PROTOCOL_STEPS = [
  'Installez-vous confortablement dans un endroit calme, idéalement allongé.',
  'Respirez lentement et profondément quelques instants avant de commencer.',
  'Lisez votre scénario alternatif une ou deux fois, en prenant votre temps.',
  'Fermez les yeux et visualisez mentalement les images du scénario.',
  'Pratiquez chaque soir, de préférence peu avant le coucher.',
] as const

// ─── Sons d'ambiance ──────────────────────────────────────────────────────────
//
// L'intégration audio (expo-audio) est prévue dans une prochaine version.
// Les boutons sont préparés et affichent l'état "Bientôt disponible".
// Pour activer l'audio : npx expo install expo-audio, puis implémenter useAudioPlayer.

interface AmbientSound {
  key: string
  label: string
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  available: boolean
}

const AMBIENT_SOUNDS: AmbientSound[] = [
  { key: 'pluie', label: 'Pluie douce', icon: 'weather-rainy', available: false },
  { key: 'vagues', label: 'Vagues', icon: 'waves', available: false },
  { key: 'foret', label: 'Forêt', icon: 'tree', available: false },
  { key: 'vent', label: 'Vent doux', icon: 'weather-windy', available: false },
  { key: 'ruisseau', label: 'Ruisseau', icon: 'water', available: false },
]

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function RimScreen() {
  const patient = useAuthStore((s) => s.patient)

  const [config, setConfig] = useState<RimConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [activeSound, setActiveSound] = useState<string | null>(null)

  // ── Chargement de la config depuis Supabase ──────────────────────────────

  const fetchConfig = useCallback(async () => {
    if (!patient) return
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('patient_modules')
      .select('config')
      .eq('patient_id', patient.id)
      .eq('module_type', 'rim')
      .is('revoked_at', null)
      .single<{ config: RimConfig }>()

    if (fetchError) {
      setError('Impossible de charger le module. Vérifiez votre connexion.')
      return
    }

    setConfig(data?.config ?? null)
  }, [patient])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      fetchConfig().finally(() => setLoading(false))
    }, [fetchConfig])
  )

  // ── États de chargement / erreur / vide ──────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="wifi-off" size={48} color={colors.border} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  if (!config?.alternative_scenario) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="playlist-edit" size={52} color={colors.border} />
        <Text style={styles.emptyTitle}>Scénario non configuré</Text>
        <Text style={styles.emptyText}>
          Votre praticien n'a pas encore renseigné votre scénario alternatif.{'\n'}
          Il sera disponible ici après votre prochaine consultation.
        </Text>
      </View>
    )
  }

  // ── Rendu principal ──────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* ── Avertissement ──────────────────────────────────────────────── */}
        <View style={styles.warningCard} testID="rim-disclaimer">
          <MaterialCommunityIcons name="shield-account-outline" size={20} color="#B45309" />
          <Text style={styles.warningText}>
            À utiliser exclusivement avec l'accompagnement d'un professionnel de
            santé formé en psychiatrie ou psychologie.
          </Text>
        </View>

        {/* ── Scénario alternatif ────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Votre scénario alternatif</Text>
          <View style={styles.scenarioCard} testID="alternative-scenario-card">
            <MaterialCommunityIcons
              name="script-text-outline"
              size={18}
              color={colors.primary}
              style={styles.scenarioIcon}
            />
            <Text style={styles.scenarioText} testID="alternative-scenario-text">
              {config.alternative_scenario}
            </Text>
          </View>
        </View>

        {/* ── Consignes du protocole ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Consignes de pratique</Text>
          <View style={styles.card} testID="protocol-steps">
            {PROTOCOL_STEPS.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Scénario initial (masqué par défaut) ──────────────────────── */}
        {!!config.original_scenario && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowOriginal((prev) => !prev)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={showOriginal ? 'Masquer le scénario initial' : 'Afficher le scénario initial'}
            >
              <Text style={styles.collapsibleLabel}>Scénario initial (référence)</Text>
              <MaterialCommunityIcons
                name={showOriginal ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {showOriginal && (
              <View style={styles.originalCard} testID="original-scenario-card">
                <Text style={styles.originalText}>{config.original_scenario}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Sons d'ambiance ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sons d'ambiance</Text>
          <Text style={styles.sectionHint}>
            Jouez un son pour accompagner votre lecture. (Disponible prochainement)
          </Text>
          <View style={styles.soundsGrid}>
            {AMBIENT_SOUNDS.map((sound) => (
              <TouchableOpacity
                key={sound.key}
                style={[
                  styles.soundBtn,
                  activeSound === sound.key && styles.soundBtnActive,
                  !sound.available && styles.soundBtnUnavailable,
                ]}
                onPress={() =>
                  sound.available &&
                  setActiveSound((prev) => (prev === sound.key ? null : sound.key))
                }
                activeOpacity={sound.available ? 0.75 : 1}
                accessibilityLabel={`Son : ${sound.label}`}
                accessibilityState={{ disabled: !sound.available }}
              >
                <MaterialCommunityIcons
                  name={sound.icon}
                  size={22}
                  color={
                    !sound.available
                      ? colors.border
                      : activeSound === sound.key
                      ? colors.white
                      : colors.primary
                  }
                />
                <Text
                  style={[
                    styles.soundLabel,
                    !sound.available && styles.soundLabelMuted,
                    activeSound === sound.key && styles.soundLabelActive,
                  ]}
                >
                  {sound.label}
                </Text>
                {!sound.available && (
                  <Text style={styles.soundComingSoon}>Bientôt</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Urgence ────────────────────────────────────────────────────── */}
        <View style={styles.safetySection} testID="safety-section">
          <Text style={styles.safetyTitle}>En cas de détresse</Text>
          <TouchableOpacity
            style={styles.safetyBtn}
            onPress={() => Linking.openURL('tel:3114')}
            accessibilityRole="button"
            accessibilityLabel="Appeler le 3114, numéro national de prévention du suicide"
          >
            <MaterialCommunityIcons name="phone" size={18} color="#DC2626" />
            <Text style={styles.safetyBtnText}>
              3114 — Numéro national prévention suicide
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.safetyBtn}
            onPress={() => Linking.openURL('tel:15')}
            accessibilityRole="button"
            accessibilityLabel="Appeler le SAMU, le 15"
          >
            <MaterialCommunityIcons name="ambulance" size={18} color="#DC2626" />
            <Text style={styles.safetyBtnText}>15 — SAMU</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
  },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Disclaimer
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  warningText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },

  // Sections
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: -spacing.xs,
  },

  // Carte générique
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Scénario alternatif
  scenarioCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: spacing.sm,
  },
  scenarioIcon: { alignSelf: 'flex-start' },
  scenarioText: { fontSize: 16, color: colors.text, lineHeight: 26 },

  // Étapes protocole
  stepRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  stepText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },

  // Scénario initial
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  collapsibleLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  originalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
  },
  originalText: { fontSize: 14, color: colors.textMuted, lineHeight: 22 },

  // Sons d'ambiance
  soundsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  soundBtn: {
    flex: 1,
    minWidth: '28%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  soundBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  soundBtnUnavailable: { opacity: 0.5 },
  soundLabel: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  soundLabelActive: { color: colors.white },
  soundLabelMuted: { color: colors.textMuted },
  soundComingSoon: { fontSize: 9, color: colors.textMuted, fontStyle: 'italic' },

  // Urgences
  safetySection: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  safetyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  safetyBtnText: { fontSize: 14, color: '#DC2626', fontWeight: '500' },
})
