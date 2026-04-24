import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { saveGAD7Entry, generateId } from '../../lib/database'
import { GAD7_DATA } from '../../data/gad7'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius, typography } from '../../theme'
import { useTeen } from '../../hooks/useTeen'

type Nav = NativeStackNavigationProp<AppStackParamList>

const QUESTIONS = GAD7_DATA.questions
const OPTIONS = GAD7_DATA.options
const TOTAL = QUESTIONS.length

// ─── Composant ligne de question ─────────────────────────────────────────────

interface QuestionRowProps {
  index: number
  question: string
  value: number | null
  accentColor: string | undefined
  onChange: (v: number) => void
}

function QuestionRow({ index, question, value, accentColor, onChange }: QuestionRowProps) {
  return (
    <View style={qStyles.container}>
      <Text style={qStyles.question}>
        <Text style={qStyles.num}>{index + 1}. </Text>
        {question}
      </Text>
      <View style={qStyles.options}>
        {OPTIONS.map(opt => {
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
  question: { fontSize: 14.5, color: colors.text, lineHeight: 21 },
  num: { fontWeight: '700', color: colors.primary },
  options: { flexDirection: 'row', gap: 6 },
  option: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  optionText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  optionTextSelected: { color: colors.white, fontWeight: '600' },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function GAD7EntryScreen() {
  const navigation = useNavigation<Nav>()
  const { isTeenMode, teenColor } = useTeen()
  const accentColor = teenColor('gad7')

  const [answers, setAnswers] = useState<(number | null)[]>(Array(TOTAL).fill(null))
  const [saving, setSaving] = useState(false)

  const setAnswer = (index: number, value: number) => {
    setAnswers(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const answeredCount = answers.filter(a => a !== null).length
  const allAnswered = answeredCount === TOTAL
  const score = answers.reduce<number>((sum, a) => sum + (a ?? 0), 0)

  const handleSubmit = async () => {
    if (!allAnswered) {
      Alert.alert(
        'Questionnaire incomplet',
        `Il reste ${TOTAL - answeredCount} question${TOTAL - answeredCount > 1 ? 's' : ''} sans réponse.`
      )
      return
    }
    setSaving(true)
    await saveGAD7Entry({
      id: generateId(),
      answers: answers as number[],
      score,
      created_at: new Date().toISOString(),
    })
    console.log('Génération PDF')
    setSaving(false)
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Consigne */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>
            {isTeenMode ? 'Ces 2 dernières semaines,' : 'Au cours des 2 dernières semaines,'}
          </Text>
          <Text style={styles.instructionText}>
            {isTeenMode
              ? 'tu as été combien gêné(e) par ces trucs ?'
              : 'à quelle fréquence avez-vous été gêné(e) par les problèmes suivants ?'}
          </Text>
        </View>

        {/* Questions */}
        <View style={styles.questions}>
          {QUESTIONS.map((q, i) => (
            <QuestionRow
              key={i}
              index={i}
              question={q}
              value={answers[i]}
              accentColor={accentColor}
              onChange={v => setAnswer(i, v)}
            />
          ))}
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text style={styles.progress}>
            {answeredCount} / {TOTAL} réponses
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
