import React, { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import * as Linking from 'expo-linking'
import { useAuthStore } from '../store/authStore'
import { initDatabase } from '../lib/database'
import { setupAndroidChannel } from '../lib/notifications'
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
    // Initialise la base de données locale et les notifications au démarrage
    const init = async () => {
      await initDatabase()
      await setupAndroidChannel()
      await loadSession()
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
