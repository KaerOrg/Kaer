import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { AppStackParamList } from '../../navigation/AppStack'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { PSYCHOEDUCATION_CARDS } from '../../constants/psychoeducationCards'
import type { UnlockedCard } from '../../lib/psychoeducation'
import { colors, spacing, radius } from '../../theme'

type Nav = NativeStackNavigationProp<AppStackParamList>

interface CardRowProps {
  card: UnlockedCard
  onPress: () => void
}

function CardRow({ card, onPress }: CardRowProps) {
  const meta = PSYCHOEDUCATION_CARDS[card.card_id]
  if (!meta) return null

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      testID={`card-row-${card.card_id}`}
    >
      <View style={styles.cardIcon}>
        <MaterialCommunityIcons name={meta.icon as never} size={28} color={colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{meta.title}</Text>
        <Text style={styles.cardSummary}>{meta.summary}</Text>
      </View>
      {card.is_read ? (
        <MaterialCommunityIcons name="check-circle" size={22} color={colors.success} testID={`read-badge-${card.card_id}`} />
      ) : (
        <View style={styles.unreadDot} testID={`unread-dot-${card.card_id}`} />
      )}
    </TouchableOpacity>
  )
}

export default function PsychoeducationScreen() {
  const navigation = useNavigation<Nav>()
  const patient = useAuthStore((s) => s.patient)

  const [unlockedCards, setUnlockedCards] = useState<UnlockedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCards = async () => {
    if (!patient) return
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('patient_modules')
      .select('config')
      .eq('patient_id', patient.id)
      .eq('module_type', 'psychoeducation')
      .is('revoked_at', null)
      .single<{ config: { unlocked_cards?: UnlockedCard[] } }>()

    if (fetchError) {
      setError('Impossible de charger les cartes. Vérifiez votre connexion.')
      return
    }

    setUnlockedCards(data?.config?.unlocked_cards ?? [])
  }

  // Recharge à chaque retour sur cet écran (ex : après avoir lu une carte)
  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      fetchCards().finally(() => setLoading(false))
    }, [patient])
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="wifi-off" size={44} color={colors.border} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  const visibleCards = unlockedCards.filter((c) => !!PSYCHOEDUCATION_CARDS[c.card_id])

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={visibleCards}
        keyExtractor={(item) => item.card_id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Psychoéducation</Text>
            <Text style={styles.subheading}>
              {visibleCards.filter((c) => c.is_read).length}/{visibleCards.length} carte
              {visibleCards.length > 1 ? 's' : ''} lue
              {visibleCards.filter((c) => c.is_read).length > 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="book-open-blank-variant" size={52} color={colors.border} />
            <Text style={styles.emptyTitle}>Aucune carte disponible</Text>
            <Text style={styles.emptyText}>
              Votre praticien n'a pas encore débloqué de cartes pour vous.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <CardRow
            card={item}
            onPress={() =>
              navigation.navigate('CardDetail', {
                cardId: item.card_id,
                isRead: item.is_read,
              })
            }
          />
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  list: { padding: spacing.lg, gap: spacing.sm },
  header: { marginBottom: spacing.md },
  heading: { fontSize: 28, fontWeight: '700', color: colors.text },
  subheading: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: { width: 40, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardSummary: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyTitle: { fontSize: 19, fontWeight: '600', color: colors.text },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
})
