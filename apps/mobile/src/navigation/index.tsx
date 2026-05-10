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
    const init = async () => {
      logger.log('[Boot] start')
      try {
        logger.log('[Boot] initDatabase...')
        await initDatabase()
        logger.log('[Boot] initDatabase OK')
        await setupAndroidChannel()
      } catch (e) {
        logger.error('[Boot] initDatabase failed', e)
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
