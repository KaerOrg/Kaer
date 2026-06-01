// ─── Layout `patient_scenario` — scénario alternatif par patient (RIM) ───────
//
// Affiche un scénario alternatif personnalisé (rédigé par le praticien et
// stocké dans `patient_modules.config`), le protocole d'étapes, le scénario
// original repliable, et une grille de sons d'ambiance. Lecture seule patient.
// Conformité MDR 2017/745 : restitution de contenu praticien, zéro interprétation.

import { useState, type ComponentProps } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../../../../theme'
import type { ContentField } from '../../../../../services/moduleService'
import { useModuleT } from '../../../../../hooks/useModuleT'
import { ExerciseSafetySection } from '../shared'
import { styles } from './styles'

export interface PatientScenarioLayoutProps {
  /** Fields du module (disclaimer, étapes, sons). */
  fields: ContentField[]
  /** Note de bas de page MDR (sources scientifiques) — affichée en bas de l'écran. */
  footer?: ContentField
  /** Config par patient (`patient_modules.config`) — scénarios personnalisés. */
  patientConfig: Record<string, unknown> | null
}

export function PatientScenarioLayout({ fields, footer, patientConfig }: PatientScenarioLayoutProps) {
  const t = useModuleT()
  const [showOriginal, setShowOriginal] = useState(false)
  const [activeSound, setActiveSound] = useState<string | null>(null)

  const alternativeScenario = typeof patientConfig?.alternative_scenario === 'string'
    ? patientConfig.alternative_scenario
    : null
  const originalScenario = typeof patientConfig?.original_scenario === 'string'
    ? patientConfig.original_scenario
    : null

  const disclaimerField = fields.find(f => f.field_type === 'rim_disclaimer')
  const stepFields = [...fields]
    .filter(f => f.field_type === 'rim_step')
    .sort((a, b) => a.sort_order - b.sort_order)
  const soundFields = [...fields]
    .filter(f => f.field_type === 'ambient_sound')
    .sort((a, b) => a.sort_order - b.sort_order)

  if (!alternativeScenario) {
    return (
      <View style={styles.emptyCenter}>
        <MaterialCommunityIcons name="playlist-edit" size={52} color={colors.border} />
        <Text style={styles.emptyTitle}>{t('modules.rim.empty_title')}</Text>
        <Text style={styles.emptyText}>{t('modules.rim.empty_text')}</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {disclaimerField != null && (
        <View style={styles.warningCard} testID="rim-disclaimer">
          <MaterialCommunityIcons name="shield-account-outline" size={20} color="#B45309" />
          <Text style={styles.warningText}>{t(disclaimerField.text_code ?? '')}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('modules.rim.section_scenario')}</Text>
        <View style={styles.scenarioCard} testID="alternative-scenario-card">
          <MaterialCommunityIcons name="script-text-outline" size={18} color={colors.primary} style={styles.scenarioIcon} />
          <Text style={styles.scenarioText} testID="alternative-scenario-text">
            {alternativeScenario}
          </Text>
        </View>
      </View>

      {stepFields.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('modules.rim.intro')}</Text>
          <View style={styles.stepsCard} testID="protocol-steps">
            {stepFields.map((f, i) => (
              <View key={f.id} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>
                    {String(f.props['step_number'] ?? i + 1)}
                  </Text>
                </View>
                <Text style={styles.stepText}>{t(f.text_code ?? '')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {originalScenario != null && (
        <View style={styles.section}>
          <Pressable
            style={styles.collapsibleHeader}
            onPress={() => setShowOriginal(prev => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showOriginal ? t('modules.rim.hide_original') : t('modules.rim.show_original')}
          >
            <Text style={styles.collapsibleLabel}>{t('modules.rim.section_original')}</Text>
            <MaterialCommunityIcons
              name={showOriginal ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
          {showOriginal && (
            <View style={styles.originalCard} testID="original-scenario-card">
              <Text style={styles.originalText}>{originalScenario}</Text>
            </View>
          )}
        </View>
      )}

      {soundFields.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('modules.rim.section_sounds')}</Text>
          <Text style={styles.sectionHint}>{t('modules.rim.sounds_hint')}</Text>
          <View style={styles.soundsGrid}>
            {soundFields.map(f => {
              const available = f.props['available'] === 'true'
              const soundKey = String(f.props['key'] ?? f.id)
              const icon = (f.props['icon'] ?? 'music') as ComponentProps<typeof MaterialCommunityIcons>['name']
              return (
                <Pressable
                  key={f.id}
                  style={[
                    styles.soundBtn,
                    activeSound === soundKey ? styles.soundBtnActive : null,
                    !available ? styles.soundBtnUnavailable : null,
                  ]}
                  onPress={() => {
                    if (available) setActiveSound(prev => prev === soundKey ? null : soundKey)
                  }}
                  accessibilityLabel={t(f.text_code ?? '')}
                  accessibilityState={{ disabled: !available }}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={22}
                    color={!available ? colors.border : activeSound === soundKey ? colors.white : colors.primary}
                  />
                  <Text style={[
                    styles.soundLabel,
                    !available ? styles.soundLabelMuted : null,
                    activeSound === soundKey ? styles.soundLabelActive : null,
                  ]}>
                    {t(f.text_code ?? '')}
                  </Text>
                  {!available && (
                    <Text style={styles.soundComingSoon}>{t('common.coming_soon')}</Text>
                  )}
                </Pressable>
              )
            })}
          </View>
        </View>
      )}

      <ExerciseSafetySection fields={fields} />

      {footer != null && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <Text style={styles.footerText}>{t(footer.text_code ?? '')}</Text>
        </View>
      )}
    </ScrollView>
  )
}
