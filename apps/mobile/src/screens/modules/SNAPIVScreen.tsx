import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { getAllSNAPIVEntries, deleteSNAPIVEntry, type SNAPIVEntry } from '../../lib/database'
import { AppStackParamList } from '../../navigation/AppStack'
import { colors, spacing, radius, typography } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

type Nav = NativeStackNavigationProp<AppStackParamList>

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function SNAPIVScreen() {
  const navigation = useNavigation<Nav>()
  const { isTeenMode, tt, teenColor } = useTeen()
  const accentColor = teenColor('snap_iv')

  const [entries, setEntries] = useState<SNAPIVEntry[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let active = true
      getAllSNAPIVEntries().then(data => {
        if (active) { setEntries(data); setLoading(false) }
      })
      return () => { active = false }
    }, [])
  )

  const handleDelete = (id: string) => {
    Alert.alert(
      'Supprimer ce questionnaire',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteSNAPIVEntry(id)
            setEntries(prev => prev.filter(e => e.id !== id))
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <TeenAccent color={accentColor} />
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <Text style={typography.h2}>SNAP-IV</Text>
          <Text style={styles.subtitle}>
            {tt('snap_iv', 'description')}
          </Text>
        </View>

        <Pressable
          style={[styles.newBtn, isTeenMode && accentColor != null && { backgroundColor: accentColor }]}
          onPress={() => navigation.navigate('SNAPIVEntry', {})}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
          <Text style={styles.newBtnText}>
            {tt('snap_iv', 'new_btn')}
          </Text>
        </Pressable>

        {entries.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>
              {tt('snap_iv', 'empty_title')}
            </Text>
            <Text style={styles.emptyText}>
              {tt('snap_iv', 'empty_text')}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {entries.map(entry => (
              <View key={entry.id} style={styles.card}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardDate}>{formatDate(entry.created_at)}</Text>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Score total</Text>
                    <Text style={[
                      styles.scoreValue,
                      isTeenMode && accentColor != null && { color: accentColor },
                    ]}>
                      {entry.total_score}
                      <Text style={styles.scoreMax}> / 78</Text>
                    </Text>
                  </View>
                  <View style={styles.chips}>
                    <View style={styles.chip}>
                      <Text style={styles.chipLabel}>I</Text>
                      <Text style={styles.chipValue}>{entry.subscale_scores.inattention}<Text style={styles.chipMax}>/27</Text></Text>
                    </View>
                    <View style={styles.chip}>
                      <Text style={styles.chipLabel}>H/I</Text>
                      <Text style={styles.chipValue}>{entry.subscale_scores.hyperactivite}<Text style={styles.chipMax}>/27</Text></Text>
                    </View>
                    <View style={styles.chip}>
                      <Text style={styles.chipLabel}>TOD</Text>
                      <Text style={styles.chipValue}>{entry.subscale_scores.tod}<Text style={styles.chipMax}>/24</Text></Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleDelete(entry.id)}
                  hitSlop={8}
                  accessibilityLabel="Supprimer"
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.note}>
          <MaterialCommunityIcons name="information-outline" size={14} color={colors.textMuted} />
          <Text style={styles.noteText}>
            Le score est transmis à votre soignant. Son interprétation lui appartient.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.md, gap: 4 },
  subtitle: { ...typography.caption },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginBottom: spacing.lg,
  },
  newBtnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: 8 },
  emptyTitle: { ...typography.h3, color: colors.textMuted, textAlign: 'center' },
  emptyText: { ...typography.caption, textAlign: 'center', maxWidth: 280 },
  list: { gap: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardMain: { flex: 1, gap: 6 },
  cardDate: { ...typography.caption, marginBottom: 2 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  scoreLabel: { fontSize: 13, color: colors.textMuted },
  scoreValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  scoreMax: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  chipValue: { fontSize: 12, fontWeight: '700', color: colors.text },
  chipMax: { fontSize: 10, fontWeight: '400', color: colors.textMuted },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.lg,
    padding: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
  },
  noteText: { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },
})
