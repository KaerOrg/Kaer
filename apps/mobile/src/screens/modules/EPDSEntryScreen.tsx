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
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { saveEPDSEntry, generateId } from '../../lib/database'
import { EPDS_DATA, computeEPDSScore } from '../../data/epds'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius, typography } from '../../theme'
import { useTeen } from '../../hooks/useTeen'

type Nav = NativeStackNavigationProp<AppStackParamList>

const ITEMS = EPDS_DATA.items
const TOTAL = ITEMS.length

// ─── Composant ligne de question ─────────────────────────────────────────────

interface QuestionRowProps {
  index: number
  item: typeof ITEMS[number]
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
      <View style={qStyles.options}>
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
              <View style={qStyles.optionInner}>
                {selected
                  ? <MaterialCommunityIcons name="check-circle" size={16} color={colors.white} />
                  : <View style={qStyles.optionCircle} />
                }
                <Text style={[qStyles.optionText, selected && qStyles.optionTextSelected]}>
                  {opt.text}
                </Text>
              </View>
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
  options: { gap: 6 },
  option: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    flex: 1,
  },
  optionTextSelected: { color: colors.white, fontWeight: '600' },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function EPDSEntryScreen() {
  const navigation = useNavigation<Nav>()
  const { teenColor } = useTeen()
  const accentColor = teenColor('epds')

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
  const score = computeEPDSScore(answers)

  const handleSubmit = async () => {
    if (!allAnswered) {
      Alert.alert(
        'Questionnaire incomplet',
        `Il reste ${TOTAL - answeredCount} question${TOTAL - answeredCount > 1 ? 's' : ''} sans réponse.`
      )
      return
    }
    setSaving(true)
    await saveEPDSEntry({
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
          <Text style={styles.instructionTitle}>Pendant la semaine qui vient de s'écouler…</Text>
          <Text style={styles.instructionText}>
            Veuillez souligner la réponse qui décrit le mieux comment vous vous êtes sentie ces 7 derniers jours.
          </Text>
        </View>

        {/* Questions */}
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
