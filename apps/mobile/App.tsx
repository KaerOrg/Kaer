import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import Navigation from './src/navigation'
import { queryClient } from './src/lib/queryClient'
import { ToastProvider } from './src/contexts/ToastContext'
import { ConfirmDialogProvider } from './src/contexts/ConfirmDialogContext'
import { ActionSheetProvider } from './src/contexts/ActionSheetContext'
import { ErrorBoundary } from './src/components/features/ErrorBoundary'
import { installGlobalErrorHandlers } from './src/services/errorReportingService'

installGlobalErrorHandlers()

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
