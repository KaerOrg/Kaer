const mockShowToast = jest.fn()
const mockShowConfirm = jest.fn((opts: { onConfirm: () => void | Promise<void> }) => {
  void opts.onConfirm()
})
const mockGenerate = jest.fn().mockResolvedValue({ ok: true, count: 60 })
const mockPurge = jest.fn().mockResolvedValue({ ok: true, count: 60 })

jest.mock('@services/demo/demoDataService', () => ({
  availableDemoModules: () => ['sleep_diary'],
  generateDemoForModule: (...a: unknown[]) => mockGenerate(...a),
  purgeAllDemo: (...a: unknown[]) => mockPurge(...a),
}))

jest.mock('../store/authStore', () => ({
  useAuthStore: () => ({ patient: { email: 'teil.patient@gmail.com' } }),
}))

jest.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

jest.mock('../contexts/ConfirmDialogContext', () => ({
  useConfirmDialog: () => ({ showConfirm: mockShowConfirm }),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@ui/Button', () => {
  const React = require('react')
  const { Pressable, Text } = require('react-native')
  const Button = (props: { label?: string; onPress: () => void; disabled?: boolean }) =>
    React.createElement(
      Pressable,
      { onPress: props.onPress, disabled: props.disabled },
      React.createElement(Text, null, props.label),
    )
  return { __esModule: true, default: Button, Button }
})

jest.mock('@ui/Card', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  const Card = (props: { header?: { title: string }; actions?: React.ReactNode }) =>
    React.createElement(
      View,
      null,
      React.createElement(Text, null, props.header?.title),
      props.actions,
    )
  return { Card }
})

jest.mock('@theme', () => ({
  colors: { background: '#fff', textMuted: '#999' },
  spacing: { md: 16, lg: 24, xl: 32 },
}))

import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native'
import DemoDataScreen from './DemoDataScreen'

beforeEach(() => jest.clearAllMocks())

describe('DemoDataScreen', () => {
  it('affiche un bouton de génération par module et le bouton de purge', () => {
    render(<DemoDataScreen />)
    expect(screen.getByText('sleep_diary')).toBeTruthy()
    expect(screen.getByText('dev.demo.generate_button')).toBeTruthy()
    expect(screen.getByText('dev.demo.purge_button')).toBeTruthy()
  })

  it('génère les données du module après confirmation', async () => {
    render(<DemoDataScreen />)
    await act(async () => {
      fireEvent.press(screen.getByText('dev.demo.generate_button'))
    })
    expect(mockShowConfirm).toHaveBeenCalledTimes(1)
    expect(mockGenerate).toHaveBeenCalledWith('sleep_diary', {
      patientEmail: 'teil.patient@gmail.com',
    })
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('dev.demo.generated', 'success')
    })
  })

  it('purge les données après confirmation', async () => {
    render(<DemoDataScreen />)
    await act(async () => {
      fireEvent.press(screen.getByText('dev.demo.purge_button'))
    })
    expect(mockShowConfirm).toHaveBeenCalledTimes(1)
    expect(mockPurge).toHaveBeenCalledWith({ patientEmail: 'teil.patient@gmail.com' })
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('dev.demo.purged', 'success')
    })
  })
})
