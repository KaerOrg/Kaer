import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, RouteProp } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import Markdown from 'react-native-markdown-display'
import { AppStackParamList } from '../../navigation/AppStack'
import { useAuthStore } from '../../store/authStore'
import { markCardAsRead } from '../../services/psychoeducationService'
import { PSYCHOEDUCATION_CARDS } from '../../constants/psychoeducationCards'
import { colors, spacing, radius } from '../../theme'
import { useTranslation } from 'react-i18next'

type RouteProps = RouteProp<AppStackParamList, 'CardDetail'>

type ReadStatus = 'idle' | 'loading' | 'done' | 'error'

export default function CardDetailScreen() {
  const route = useRoute<RouteProps>()
  const { cardId, isRead: initialIsRead } = route.params
  const patient = useAuthStore((s) => s.patient)
  const { t } = useTranslation()

  const [readStatus, setReadStatus] = useState<ReadStatus>(
    initialIsRead ? 'done' : 'idle'
  )

  const card = PSYCHOEDUCATION_CARDS[cardId]

  const handleMarkAsRead = async () => {
    if (!patient || readStatus !== 'idle') return
    setReadStatus('loading')
    try {
      await markCardAsRead(patient.id, cardId)
      setReadStatus('done')
    } catch {
      setReadStatus('error')
    }
  }

  // Cas improbable : carte inconnue dans le dictionnaire local
  if (!card) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('modules.psychoeducation.content_not_found')}</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Contenu défilable */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Markdown style={markdownStyles}>{card.content}</Markdown>
        {/* Espace pour que le bouton fixe ne cache pas le bas du contenu */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bouton fixe en bas */}
      <View style={styles.footer}>
        {readStatus === 'error' && (
          <Text style={styles.errorBanner} testID="read-error-banner">
            {t('modules.psychoeducation.read_error')}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.readButton,
            readStatus === 'done' && styles.readButtonDone,
            (readStatus === 'loading' || readStatus === 'done') && styles.readButtonDisabled,
          ]}
          onPress={handleMarkAsRead}
          disabled={readStatus === 'loading' || readStatus === 'done'}
          activeOpacity={0.8}
          testID="mark-as-read-button"
        >
          {readStatus === 'loading' ? (
            <ActivityIndicator color={colors.white} size="small" testID="read-loading-indicator" />
          ) : readStatus === 'done' ? (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.white} />
              <Text style={styles.readButtonText}>{t('modules.psychoeducation.already_read')}</Text>
            </>
          ) : (
            <Text style={styles.readButtonText}>{t('modules.psychoeducation.mark_as_read')}</Text>
          )}
        </TouchableOpacity>
      </View>
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
    padding: spacing.lg,
  },
  errorText: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  scrollContent: {
    padding: spacing.lg,
  },
  bottomSpacer: { height: 80 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  errorBanner: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  readButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  readButtonDone: {
    backgroundColor: colors.success,
  },
  readButtonDisabled: {
    opacity: 0.75,
  },
  readButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
})

// Styles appliqués au rendu Markdown
const markdownStyles = StyleSheet.create({
  body: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 26,
  },
  heading1: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  heading3: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  heading4: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  paragraph: {
    marginBottom: spacing.sm,
    color: colors.text,
  },
  strong: {
    fontWeight: '700',
    color: colors.text,
  },
  em: {
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  bullet_list: {
    marginBottom: spacing.sm,
  },
  list_item: {
    marginBottom: spacing.xs,
  },
  hr: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.md,
  },
  blockquote: {
    backgroundColor: colors.primaryLight,
    borderLeftColor: colors.primary,
    borderLeftWidth: 4,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
    marginVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  code_inline: {
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 4,
  },
})
