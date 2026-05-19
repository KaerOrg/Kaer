import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Navigation from './src/navigation'
import { ToastProvider } from './src/contexts/ToastContext'

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <StatusBar style="dark" />
        <Navigation />
      </ToastProvider>
    </SafeAreaProvider>
  )
}
