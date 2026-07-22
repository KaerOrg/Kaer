import React, { useCallback, useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import * as Linking from 'expo-linking'
import { logger } from '@kaer/shared'
import { useAuthStore } from '../store/authStore'
import { initDatabase } from '../lib/database'
import {
  configureForegroundNotifications,
  setupAndroidChannel,
  shouldShowNotificationOnboarding,
} from '@services/notificationService'
import { useSyncOnForeground } from '../hooks/useSyncOnForeground'
import AuthStack from './AuthStack'
import AppStack from './AppStack'
import NotificationPermissionScreen from '../screens/NotificationPermissionScreen'
import { colors } from '@theme'

// Schéma de deep link : psytool://invite?token=xxx
const linking = {
  prefixes: [Linking.createURL('/'), 'psytool://'],
  config: {
    screens: {
      Login: '',
      Register: 'invite',
    },
  },
}

// Étape d'onboarding notifications, évaluée une fois le patient connecté.
type NotifGate = 'checking' | 'show' | 'done'

function BootSpinner() {
  return (
    <View style={styles.spinner}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  )
}

export default function Navigation() {
  const { patient, loading, loadSession, restoreLanguage } = useAuthStore()
  const [notifGate, setNotifGate] = useState<NotifGate>('checking')
  useSyncOnForeground()

  useEffect(() => {
    const withTimeout = (p: Promise<void>, ms: number, label: string): Promise<void> =>
      Promise.race([
        p,
        new Promise<void>(resolve => setTimeout(() => {
          logger.warn(`[Boot] ${label} timed out after ${ms}ms — continuing`)
          resolve()
        }, ms)),
      ])

    const init = async () => {
      logger.log('[Boot] start')
      // Enregistré en premier, avant toute arrivée de notification, pour que les
      // notifications reçues app ouverte soient bien affichées (bannière + son).
      configureForegroundNotifications()
      // Avant tout rendu de texte : restaure la langue choisie précédemment.
      try {
        await withTimeout(restoreLanguage(), 2000, 'restoreLanguage')
      } catch (e) {
        logger.error('[Boot] restoreLanguage failed', e)
      }
      try {
        logger.log('[Boot] initDatabase...')
        await withTimeout(initDatabase(), 8000, 'initDatabase')
        logger.log('[Boot] initDatabase OK')
      } catch (e) {
        logger.error('[Boot] initDatabase failed', e)
      }
      try {
        await withTimeout(setupAndroidChannel(), 3000, 'setupAndroidChannel')
      } catch (e) {
        logger.error('[Boot] setupAndroidChannel failed', e)
      }
      logger.log('[Boot] loadSession...')
      await loadSession()
      logger.log('[Boot] loadSession OK')
    }
    init()
  }, [])

  useEffect(() => {
    if (!patient) {
      setNotifGate('checking')
      return
    }
    let cancelled = false
    shouldShowNotificationOnboarding().then((show) => {
      if (!cancelled) setNotifGate(show ? 'show' : 'done')
    })
    return () => {
      cancelled = true
    }
  }, [patient])

  const handleNotifDone = useCallback(() => setNotifGate('done'), [])

  if (loading) return <BootSpinner />

  if (patient && notifGate === 'checking') return <BootSpinner />

  if (patient && notifGate === 'show') {
    return <NotificationPermissionScreen onDone={handleNotifDone} />
  }

  return (
    <NavigationContainer linking={patient ? undefined : linking}>
      {patient ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  spinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
})
