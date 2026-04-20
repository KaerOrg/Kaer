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
import { getAllBSL23Entries, deleteBSL23Entry, type BSL23Entry } from '../../lib/database'
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

export default function BSL23Screen() {
  const navigation = useNavigation<Nav>()
  const { isTeenMode, tt, teenColor } = useTeen()
  const accentColor = teenColor('bsl23')

  const [entries, setEntries] = useState<BSL23Entry[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let active = true
      getAllBSL23Entries().then(data => {
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
            await deleteBSL23Entry(id)
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
          <Text style={typography.h2}>BSL-23</Text>
        </View>

        <Pressable
          style={[styles.newBtn, isTeenMode && accentColor && { backgroundColor: accentColor }]}
          onPress={() => navigation.navigate('BSL23Entry', {})}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
          <Text style={styles.newBtnText}>
            {tt('Nouveau questionnaire', 'Remplir le questionnaire')}
          </Text>
        </Pressable>

        {entries.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>
              {tt('Aucun questionnaire rempli', 'Rien pour l\'instant')}
            </Text>
            <Text style={styles.emptyText}>
              {tt(
                'Utilisez le bouton ci-dessus pour compléter votre premier BSL-23.',
                'Appuie sur le bouton pour commencer.'
              )}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {entries.map(entry => (
              <View key={entry.id} style={styles.card}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardDate}>{formatDate(entry.created_at)}</Text>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Score moyen</Text>
                    <Text style={[
                      styles.scoreValue,
                      isTeenMode && accentColor && { color: accentColor },
                    ]}>
                      {entry.mean_score.toFixed(2)}
                      <Text style={styles.scoreMax}> / 4</Text>
                    </Text>
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
  header: { marginBottom: spacing.md },
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardMain: { flex: 1 },
  cardDate: { ...typography.caption, marginBottom: 6 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  scoreLabel: { fontSize: 13, color: colors.textMuted },
  scoreValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  scoreMax: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
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
