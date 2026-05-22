import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Navigation from './src/navigation'
import { ToastProvider } from './src/contexts/ToastContext'
import { ConfirmDialogProvider } from './src/contexts/ConfirmDialogContext'
import { ActionSheetProvider } from './src/contexts/ActionSheetContext'

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
          <ActionSheetProvider>
            <StatusBar style="dark" />
            <Navigation />
          </ActionSheetProvider>
        </ConfirmDialogProvider>
      </ToastProvider>
    </SafeAreaProvider>
  )
}
