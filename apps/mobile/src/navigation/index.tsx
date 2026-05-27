import React, { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import * as Linking from 'expo-linking'
import { logger } from '@psytool/shared'
import { useAuthStore } from '../store/authStore'
import { initDatabase } from '../lib/database'
import { setupAndroidChannel } from '../services/notificationService'
import AuthStack from './AuthStack'
import AppStack from './AppStack'
import { colors } from '../theme'

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

export default function Navigation() {
  const { patient, loading, loadSession } = useAuthStore()

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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer linking={patient ? undefined : linking}>
      {patient ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  )
}
