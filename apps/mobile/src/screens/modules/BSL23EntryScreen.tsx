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
import { saveBSL23Entry, generateId } from '../../lib/database'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius, typography } from '../../theme'
import { useTeen } from '../../hooks/useTeen'

type Nav = NativeStackNavigationProp<AppStackParamList>

// ─── Contenu du BSL-23 ───────────────────────────────────────────────────────

const QUESTIONS = [
  "Me sentir dans un état d'engourdissement intérieur",
  "Me sentir inutile",
  "Me sentir mal à l'aise dans ma propre peau",
  "Avoir envie de me faire du mal",
  "Avoir l'impression d'être à l'extérieur de mon propre corps",
  "Me sentir comme une mauvaise personne",
  "Me sentir vide intérieurement",
  "Être incapable d'exprimer mes émotions",
  "Penser à me blesser ou à me faire du mal",
  "Avoir l'impression de ne pas exister",
  "Avoir du mal à me concentrer",
  "Me sentir si mal que j'ai envie de me faire du mal",
  "Me sentir si tendu(e) que j'ai l'impression que je vais exploser",
  "Me sentir agité(e) et incapable de me calmer",
  "Me sentir émotionnellement instable",
  "Avoir peur d'être abandonné(e)",
  "Me sentir incompris(e) et seul(e)",
  "Avoir du mal à croire que les autres me respectent",
  "Me sentir soudainement vide et désespéré(e)",
  "Me sentir en colère et irritable sans raison apparente",
  "Avoir l'impression que les autres me voient négativement",
  "Me sentir déprimé(e)",
  "Avoir peur de l'avenir",
] as const

const OPTIONS = [0, 1, 2, 3, 4] as const

// ─── Composant question ───────────────────────────────────────────────────────

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
          const selected = value === opt
          return (
            <Pressable
              key={opt}
              style={[
                qStyles.option,
                selected && {
                  backgroundColor: accentColor ?? colors.primary,
                  borderColor: accentColor ?? colors.primary,
                },
              ]}
              onPress={() => onChange(opt)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[qStyles.optionText, selected && qStyles.optionTextSelected]}>
                {opt}
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
  options: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  optionTextSelected: { color: colors.white },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function BSL23EntryScreen() {
  const navigation = useNavigation<Nav>()
  const { tt, teenColor } = useTeen()
  const accentColor = teenColor('bsl23')

  const [answers, setAnswers] = useState<(number | null)[]>(Array(23).fill(null))
  const [saving, setSaving] = useState(false)

  const setAnswer = (index: number, value: number) => {
    setAnswers(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const answeredCount = answers.filter(a => a !== null).length
  const allAnswered = answeredCount === 23
  const meanScore = allAnswered
    ? (answers as number[]).reduce((sum, a) => sum + a, 0) / 23
    : null

  const handleSubmit = async () => {
    if (!allAnswered) {
      Alert.alert(
        'Questionnaire incomplet',
        `Il reste ${23 - answeredCount} question${23 - answeredCount > 1 ? 's' : ''} sans réponse.`
      )
      return
    }
    setSaving(true)
    await saveBSL23Entry({
      id: generateId(),
      answers: answers as number[],
      mean_score: parseFloat((meanScore as number).toFixed(4)),
      created_at: new Date().toISOString(),
    })
    setSaving(false)
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Consigne + légende */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>
            {tt('Au cours de la semaine passée,', 'Cette semaine,')}
          </Text>
          <Text style={styles.instructionText}>
            {tt(
              'dans quelle mesure avez-vous souffert des problèmes suivants ?',
              'tu as souffert de ces problèmes à quel point ?'
            )}
          </Text>
          <View style={styles.legend}>
            {([
              [0, 'Pas du tout'],
              [1, 'Un peu'],
              [2, 'Assez'],
              [3, 'Beaucoup'],
              [4, 'Extrêmement'],
            ] as [number, string][]).map(([n, label]) => (
              <View key={n} style={styles.legendItem}>
                <Text style={styles.legendNum}>{n}</Text>
                <Text style={styles.legendLabel}>{label}</Text>
              </View>
            ))}
          </View>
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

        {/* Pied */}
        <View style={styles.footer}>
          <Text style={styles.progress}>{answeredCount} / 23</Text>
          <Pressable
            style={[
              styles.submitBtn,
              !allAnswered && styles.submitBtnDisabled,
              typeof accentColor === 'string' && allAnswered && { backgroundColor: accentColor },
            ]}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Text style={styles.submitBtnText}>
              {saving
                ? tt('Enregistrement…', 'Enregistrement…')
                : tt('Valider le questionnaire', 'Envoyer mes réponses')}
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
    gap: spacing.sm,
  },
  instructionTitle: { ...typography.h3, fontSize: 15 },
  instructionText: { ...typography.caption },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  legendItem: { alignItems: 'center', flex: 1 },
  legendNum: { fontSize: 15, fontWeight: '700', color: colors.primary },
  legendLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
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
