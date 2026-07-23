import React from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@ui/EmptyState'
import { colors } from '@theme'

/**
 * Écran placeholder « page en chantier ». Destination temporaire des lignes du
 * Profil dont l'écran dédié sera conçu dans un ticket ultérieur (Mon praticien,
 * Mes documents, Notifications, Confidentialité). Le titre de l'en-tête natif est
 * fourni par la navigation ; le corps affiche l'état vide du design system.
 */
export default function WorkInProgressScreen() {
  const { t } = useTranslation()
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <EmptyState
        icon="🚧"
        title={t('wip.title')}
        description={t('wip.description')}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
})
