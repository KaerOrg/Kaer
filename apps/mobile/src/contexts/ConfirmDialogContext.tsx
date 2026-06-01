import React, { createContext, useCallback, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmDialog, { type ConfirmDialogConfig } from '../components/ui/ConfirmDialog'

interface ConfirmDialogState extends ConfirmDialogConfig {
  visible: boolean
}

interface ConfirmDialogContextValue {
  showConfirm: (config: ConfirmDialogConfig) => void
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null)

const INITIAL: ConfirmDialogState = {
  visible: false,
  title: '',
  onConfirm: () => {},
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const [state, setState] = useState<ConfirmDialogState>(INITIAL)

  const showConfirm = useCallback((config: ConfirmDialogConfig) => {
    setState({ ...config, visible: true })
  }, [])

  const handleCancel = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }))
  }, [])

  const handleConfirm = useCallback(async () => {
    setState(prev => ({ ...prev, visible: false }))
    await Promise.resolve(state.onConfirm())
  }, [state.onConfirm])

  return (
    <ConfirmDialogContext.Provider value={{ showConfirm }}>
      {children}
      <ConfirmDialog
        visible={state.visible}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel ?? t('common.confirm')}
        cancelLabel={t('common.cancel')}
        destructive={state.destructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog(): ConfirmDialogContextValue {
  const ctx = useContext(ConfirmDialogContext)
  if (!ctx) throw new Error('useConfirmDialog must be used inside ConfirmDialogProvider')
  return ctx
}
