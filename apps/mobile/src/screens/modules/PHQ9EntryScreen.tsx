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
import { savePHQ9Entry, generateId } from '../../lib/database'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius, typography } from '../../theme'
import { useTeen } from '../../hooks/useTeen'

type Nav = NativeStackNavigationProp<AppStackParamList>

// ─── Contenu du PHQ-9 ────────────────────────────────────────────────────────

const QUESTIONS = [
  "Peu d'intérêt ou de plaisir à faire les choses",
  "Vous sentir triste, déprimé(e) ou sans espoir",
  "Difficultés à vous endormir ou à rester endormi(e), ou au contraire dormir trop",
  "Se sentir fatigué(e) ou manquer d'énergie",
  "Manque d'appétit ou au contraire manger trop",
  "Vous sentir négatif(ve) par rapport à vous-même — avoir le sentiment d'être nul(le) ou d'avoir déçu votre entourage",
  "Avoir du mal à vous concentrer — lire ou regarder la télévision par exemple",
  "Bouger ou parler si lentement que les autres ont pu le remarquer — ou au contraire être si agité(e) que vous bougez beaucoup plus que d'habitude",
  "Avoir des pensées comme quoi vous seriez mieux mort(e) ou que vous souhaiteriez vous faire du mal d'une façon ou d'une autre",
] as const

const OPTIONS = [
  { value: 0, label: 'Jamais' },
  { value: 1, label: 'Plusieurs jours' },
  { value: 2, label: 'Plus de la moitié\ndes jours' },
  { value: 3, label: 'Presque\ntous les jours' },
] as const

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
                {opt.label}
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

export default function PHQ9EntryScreen() {
  const navigation = useNavigation<Nav>()
  const { tt, teenColor } = useTeen()
  const accentColor = teenColor('phq9')

  const [answers, setAnswers] = useState<(number | null)[]>(Array(9).fill(null))
  const [saving, setSaving] = useState(false)

  const setAnswer = (index: number, value: number) => {
    setAnswers(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const answeredCount = answers.filter(a => a !== null).length
  const allAnswered = answeredCount === 9
  const score = answers.reduce<number>((sum, a) => sum + (a ?? 0), 0)

  const handleSubmit = async () => {
    if (!allAnswered) {
      Alert.alert(
        'Questionnaire incomplet',
        `Il reste ${9 - answeredCount} question${9 - answeredCount > 1 ? 's' : ''} sans réponse.`
      )
      return
    }
    setSaving(true)
    await savePHQ9Entry({
      id: generateId(),
      answers: answers as number[],
      score,
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
          <Text style={styles.instructionTitle}>
            {tt('Au cours des 2 dernières semaines,', 'Ces 2 dernières semaines,')}
          </Text>
          <Text style={styles.instructionText}>
            {tt(
              "à quelle fréquence avez-vous été gêné(e) par les problèmes suivants ?",
              "tu as été combien gêné(e) par ces trucs ?"
            )}
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
            {answeredCount} / 9 {tt('réponses', 'réponses')}
          </Text>

          <Pressable
            style={[
              styles.submitBtn,
              !allAnswered && styles.submitBtnDisabled,
              isActiveColor(accentColor) && allAnswered && { backgroundColor: accentColor },
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

function isActiveColor(c: string | undefined): c is string {
  return typeof c === 'string'
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
