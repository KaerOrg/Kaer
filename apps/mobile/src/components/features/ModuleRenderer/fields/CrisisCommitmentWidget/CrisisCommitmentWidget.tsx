// ─── Widget `crisis_commitment_preview` (mobile) : engagement thérapeutique ──
//
// Version interactive patient : phrase d'engagement (configurée par le praticien,
// Supabase) + signature nom/date (SQLite via `crisisPlanService`). Conformité
// MDR 2017/745 : trace d'engagement libre du patient, zéro interprétation.

import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors, spacing, radius } from '@theme'
import { Button } from '@ui/Button'
import { InputField } from '@ui/InputField'
import { formatDateLong } from '../../../../../lib/dateUtils'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useAuthStore } from '../../../../../store/authStore'
import { useToast } from '../../../../../contexts/ToastContext'
import {
  getCommitment,
  saveCommitment,
  fetchPractitionerConfig,
  type CrisisCommitment,
} from '../../../../../services/crisisPlanService'

export function CrisisCommitmentWidget() {
  const t = useModuleTranslation()
  const patient = useAuthStore(s => s.patient)
  const { showToast } = useToast()
  const [commitment, setCommitment] = useState<CrisisCommitment | null>(null)
  const [commitmentPhrase, setCommitmentPhrase] = useState('')
  const [signingName, setSigningName] = useState('')
  const [signing, setSigning] = useState(false)

  useFocusEffect(useCallback(() => {
    let active = true
    Promise.all([
      getCommitment(),
      patient ? fetchPractitionerConfig(patient.id).then(c => c.commitmentPhrase) : Promise.resolve(''),
    ]).then(([c, phrase]) => {
      if (!active) return
      setCommitment(c)
      setCommitmentPhrase(phrase || t('modules.crisis_plan.commitment_phrase_default'))
    }).catch(() => {})
    return () => { active = false }
  }, [patient, t]))

  const handleSign = useCallback(async () => {
    const trimmed = signingName.trim()
    if (!trimmed) return
    try {
      await saveCommitment(trimmed)
      setCommitment({ name: trimmed, date: new Date().toISOString() })
      setSigning(false)
      setSigningName('')
    } catch {
      showToast(t('common.save_error'), 'error')
    }
  }, [signingName, t, showToast])

  const startSigning = useCallback(() => setSigning(true), [])

  const showForm = !commitment || signing

  return (
    <View style={[styles.section, styles.commitmentSection]}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="handshake-outline" size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>{t('modules.crisis_plan.commitment_title')}</Text>
      </View>
      <Text style={styles.commitmentPhrase}>{commitmentPhrase}</Text>

      {showForm ? (
        <View style={styles.commitmentForm}>
          <InputField
            label={t('modules.crisis_plan.commitment_sign_label')}
            value={signingName}
            onChangeText={setSigningName}
            placeholder={t('modules.crisis_plan.commitment_sign_placeholder')}
          />
          <Button
            variant="primary"
            label={t('modules.crisis_plan.commitment_sign_button')}
            onPress={handleSign}
            disabled={!signingName.trim()}
          />
        </View>
      ) : (
        <View style={styles.commitmentSigned}>
          <View style={styles.commitmentSignedRow}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.commitmentSignedText}>
              <Text style={styles.commitmentSignedName}>{commitment.name}</Text>
              {' '}
              {t('modules.crisis_plan.commitment_signed_on').replace('{{date}}', formatDateLong(commitment.date))}
            </Text>
          </View>
          <Pressable onPress={startSigning} accessibilityRole="button">
            <Text style={styles.commitmentUpdate}>{t('modules.crisis_plan.commitment_update')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section:           { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  commitmentSection: { borderWidth: 1.5, borderColor: colors.primaryLight },
  sectionHeader:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle:      { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },

  commitmentPhrase: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    fontStyle: 'italic',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  commitmentForm:       { gap: spacing.sm },
  commitmentSigned:     { gap: spacing.xs, alignItems: 'flex-start' },
  commitmentSignedRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  commitmentSignedText: { flex: 1, fontSize: 13, color: colors.text },
  commitmentSignedName: { fontWeight: '700' },
  commitmentUpdate:     { fontSize: 12, color: colors.primary, textDecorationLine: 'underline', marginTop: 2 },
})
