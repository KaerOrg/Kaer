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
import { saveSNAPIVEntry, generateId } from '../../lib/database'
import { SNAPIV_DATA, computeSNAPIVSubscaleScores } from '../../data/snapiv'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius, typography } from '../../theme'
import { useTeen } from '../../hooks/useTeen'

type Nav = NativeStackNavigationProp<AppStackParamList>

const ITEMS = SNAPIV_DATA.items
const OPTIONS = SNAPIV_DATA.options
const TOTAL = ITEMS.length // 26

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

// ─── Séparateur de section ────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={sStyles.container}>
      <View style={sStyles.line} />
      <Text style={sStyles.label}>{label}</Text>
      <View style={sStyles.line} />
    </View>
  )
}

const sStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  label: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function SNAPIVEntryScreen() {
  const navigation = useNavigation<Nav>()
  const { teenColor } = useTeen()
  const accentColor = teenColor('snap_iv')

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
  const totalScore = answers.reduce<number>((sum, a) => sum + (a ?? 0), 0)

  const handleSubmit = async () => {
    if (!allAnswered) {
      Alert.alert(
        'Questionnaire incomplet',
        `Il reste ${TOTAL - answeredCount} question${TOTAL - answeredCount > 1 ? 's' : ''} sans réponse.`
      )
      return
    }
    setSaving(true)
    const answersAsNumbers = answers as number[]
    await saveSNAPIVEntry({
      id: generateId(),
      answers: answersAsNumbers,
      subscale_scores: computeSNAPIVSubscaleScores(answersAsNumbers),
      total_score: totalScore,
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
          <Text style={styles.instructionTitle}>Pour chacun des comportements ci-dessous,</Text>
          <Text style={styles.instructionText}>
            indiquez à quelle fréquence vous l'observez chez l'enfant.
          </Text>
        </View>

        {/* Note hétéro-évaluation */}
        <View style={styles.noteHetero}>
          <Text style={styles.noteHeteroText}>
            Ce questionnaire est destiné à un parent, un tuteur ou un enseignant — pas à l'enfant lui-même.
          </Text>
        </View>

        {/* Questions avec séparateurs de section */}
        <View style={styles.questions}>
          <SectionHeader label="Inattention" />
          {ITEMS.slice(0, 9).map((item, i) => (
            <QuestionRow
              key={i}
              index={i}
              question={item.question}
              value={answers[i]}
              accentColor={accentColor}
              onChange={v => setAnswer(i, v)}
            />
          ))}

          <SectionHeader label="Hyperactivité · Impulsivité" />
          {ITEMS.slice(9, 18).map((item, i) => (
            <QuestionRow
              key={i + 9}
              index={i + 9}
              question={item.question}
              value={answers[i + 9]}
              accentColor={accentColor}
              onChange={v => setAnswer(i + 9, v)}
            />
          ))}

          <SectionHeader label="Opposition · Défiance" />
          {ITEMS.slice(18, 26).map((item, i) => (
            <QuestionRow
              key={i + 18}
              index={i + 18}
              question={item.question}
              value={answers[i + 18]}
              accentColor={accentColor}
              onChange={v => setAnswer(i + 18, v)}
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
  noteHetero: {
    backgroundColor: '#FEF9C3',
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  noteHeteroText: { fontSize: 12, color: '#713F12', lineHeight: 17 },
  questions: { gap: spacing.sm },
  footer: { gap: spacing.sm, marginTop: 4 },
  progress: { textAlign: 'center', fontSize: 13, color: colors.textMuted },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: colors.border },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
})
