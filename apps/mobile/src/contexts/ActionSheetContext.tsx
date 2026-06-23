import React, { createContext, useCallback, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ActionSheet, { type ActionSheetConfig } from '@ui/ActionSheet'

interface ActionSheetState extends ActionSheetConfig {
  visible: boolean
}

interface ActionSheetContextValue {
  showActionSheet: (config: Omit<ActionSheetConfig, 'cancelLabel'>) => void
}

const ActionSheetContext = createContext<ActionSheetContextValue | null>(null)

const INITIAL: ActionSheetState = {
  visible: false,
  options: [],
  cancelLabel: '',
}

export function ActionSheetProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const [state, setState] = useState<ActionSheetState>(INITIAL)

  const showActionSheet = useCallback((config: Omit<ActionSheetConfig, 'cancelLabel'>) => {
    setState({ ...config, cancelLabel: '', visible: true })
  }, [])

  const handleClose = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }))
  }, [])

  return (
    <ActionSheetContext.Provider value={{ showActionSheet }}>
      {children}
      <ActionSheet
        visible={state.visible}
        title={state.title}
        options={state.options}
        cancelLabel={t('common.cancel')}
        onClose={handleClose}
      />
    </ActionSheetContext.Provider>
  )
}

export function useActionSheet(): ActionSheetContextValue {
  const ctx = useContext(ActionSheetContext)
  if (!ctx) throw new Error('useActionSheet must be used inside ActionSheetProvider')
  return ctx
}
