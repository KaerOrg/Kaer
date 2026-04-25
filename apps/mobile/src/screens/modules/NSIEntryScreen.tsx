import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { saveNSIEntry, generateId } from '../../lib/database'
import { NSI_DATA, computeNSIScore, type NSIItem } from '../../data/nsi'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius, typography } from '../../theme'
import { useTeen } from '../../hooks/useTeen'

type Nav = NativeStackNavigationProp<AppStackParamList>

const ITEMS = NSI_DATA.items
const SCORED_COUNT = ITEMS.length // 9

// ─── Composant ligne de question ─────────────────────────────────────────────

interface QuestionRowProps {
  index: number
  item: NSIItem
  value: number | null
  accentColor: string | undefined
  onChange: (v: number) => void
}

function QuestionRow({ index, item, value, accentColor, onChange }: QuestionRowProps) {
  return (
    <View style={qStyles.container}>
      <Text style={qStyles.question}>
        <Text style={qStyles.num}>{index + 1}. </Text>
        {item.text}
      </Text>
      <View style={qStyles.optionsRow}>
        {item.options.map(opt => {
          const selected = value === opt.value
          return (
            <Pressable
              key={opt.value}
              style={[
                qStyles.option,
                selected && { backgroundColor: accentColor ?? colors.primary, borderColor: accentColor ?? colors.primary },
              ]}
              onPress={() => onChange(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[qStyles.optionText, selected && qStyles.optionTextSelected]}>
                {opt.text}
              </Text>
            </Pressable>
          )
        })}
      </View>
      {item.anchors != null && (
        <View style={qStyles.anchorsRow}>
          <Text style={qStyles.anchorText}>{item.anchors.left}</Text>
          <Text style={qStyles.anchorText}>{item.anchors.right}</Text>
        </View>
      )}
    </View>
  )
}

const qStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  question: { fontSize: 14, color: colors.text, lineHeight: 20 },
  num: { fontWeight: '700', color: colors.primary },
  optionsRow: { flexDirection: 'row', gap: 4 },
  option: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  optionText: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
  optionTextSelected: { color: colors.white, fontWeight: '700' },
  anchorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  anchorText: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic' },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function NSIEntryScreen() {
  const navigation = useNavigation<Nav>()
  const { teenColor } = useTeen()
  const accentColor = teenColor('nsi')

  const [answers, setAnswers] = useState<(number | null)[]>(Array(SCORED_COUNT).fill(null))
  const [recurrentPct, setRecurrentPct] = useState<string>('')
  const [themes, setThemes] = useState<[string, string, string]>(['', '', ''])
  const [saving, setSaving] = useState(false)

  const setAnswer = (index: number, value: number) => {
    setAnswers(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const setTheme = (index: number, value: string) => {
    setThemes(prev => {
      const next: [string, string, string] = [...prev] as [string, string, string]
      next[index] = value
      return next
    })
  }

  const answeredCount = answers.filter(a => a !== null).length
  const allAnswered = answeredCount === SCORED_COUNT
  const score = computeNSIScore(answers)

  const handleSubmit = async () => {
    if (!allAnswered) {
      Alert.alert(
        'Questionnaire incomplet',
        `Il reste ${SCORED_COUNT - answeredCount} question${SCORED_COUNT - answeredCount > 1 ? 's' : ''} sans réponse.`
      )
      return
    }

    const pctRaw = recurrentPct.trim()
    const pct = pctRaw !== '' ? parseInt(pctRaw, 10) : null
    const filteredThemes = themes.map(t => t.trim()).filter(t => t.length > 0)

    setSaving(true)
    await saveNSIEntry({
      id: generateId(),
      answers: answers as number[],
      score,
      recurrent_pct: pct !== null && !isNaN(pct) ? Math.min(100, Math.max(0, pct)) : null,
      themes: filteredThemes,
      created_at: new Date().toISOString(),
    })
    setSaving(false)
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Consigne */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Au cours du dernier mois,</Text>
          <Text style={styles.instructionText}>
            veuillez estimer chaque aspect de vos cauchemars.
          </Text>
        </View>

        {/* Questions 1–9 */}
        <View style={styles.questions}>
          {ITEMS.map((item, i) => (
            <QuestionRow
              key={i}
              index={i}
              item={item}
              value={answers[i]}
              accentColor={accentColor}
              onChange={v => setAnswer(i, v)}
            />
          ))}
        </View>

        {/* Items 10-11 — Informations qualitatives (optionnel) */}
        <View style={styles.qualitativeSection}>
          <Text style={styles.qualitativeTitle}>Informations complémentaires (facultatif)</Text>

          <View style={styles.qualitativeCard}>
            <Text style={styles.qualitativeLabel}>
              10. Quel pourcentage de vos cauchemars sont des cauchemars récurrents ?
            </Text>
            <View style={styles.pctRow}>
              <TextInput
                style={styles.pctInput}
                value={recurrentPct}
                onChangeText={setRecurrentPct}
                keyboardType="numeric"
                maxLength={3}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Pourcentage de cauchemars récurrents"
              />
              <Text style={styles.pctUnit}>%</Text>
            </View>
          </View>

          <View style={styles.qualitativeCard}>
            <Text style={styles.qualitativeLabel}>
              11. Quel(s) est(sont) le(s) thème(s) récurrent(s) de vos cauchemars ?
            </Text>
            {themes.map((theme, i) => (
              <TextInput
                key={i}
                style={styles.themeInput}
                value={theme}
                onChangeText={v => setTheme(i, v)}
                placeholder={`Thème ${i + 1}…`}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={`Thème récurrent ${i + 1}`}
              />
            ))}
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text style={styles.progress}>
            {answeredCount} / {SCORED_COUNT} réponses
          </Text>

          <Pressable
            style={[
              styles.submitBtn,
              !allAnswered && styles.submitBtnDisabled,
              accentColor != null && allAnswered && { backgroundColor: accentColor },
            ]}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Text style={styles.submitBtnText}>
              {saving ? 'Enregistrement…' : 'Valider le questionnaire'}
            </Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  instructions: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  instructionTitle: { ...typography.h3, fontSize: 15 },
  instructionText: { ...typography.caption },
  questions: { gap: spacing.sm },
  qualitativeSection: { gap: spacing.sm },
  qualitativeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 2,
  },
  qualitativeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  qualitativeLabel: { fontSize: 14, color: colors.text, lineHeight: 20 },
  pctRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pctInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    width: 70,
    textAlign: 'center',
  },
  pctUnit: { fontSize: 16, color: colors.textMuted },
  themeInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },
  footer: { gap: spacing.sm, marginTop: 4 },
  progress: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.textMuted,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: colors.border },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
})
