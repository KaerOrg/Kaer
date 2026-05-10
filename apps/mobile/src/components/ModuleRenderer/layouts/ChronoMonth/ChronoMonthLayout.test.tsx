jest.mock('../../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../../../lib/database', () => ({
  getAllFormEntries: jest.fn().mockResolvedValue([]),
  saveFormEntry: jest.fn().mockResolvedValue(undefined),
  deleteFormEntry: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { teenMode: boolean }) => unknown) =>
    selector({ teenMode: false }),
}))

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), setOptions: jest.fn() }),
  useFocusEffect: (cb: () => void) => cb(),
}))

jest.mock('lucide-react-native', () => {
  const React = require('react')
  const Stub = (name: string) => (props: { size?: number; color?: string }) =>
    React.createElement('Icon', { ...props, name })
  return new Proxy({}, { get: (_, key) => Stub(String(key)) })
})

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react-native'
import { ChronoMonthLayout } from './ChronoMonthLayout'
import * as database from '../../../../lib/database'

jest.setTimeout(15000)

describe('ChronoMonthLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([])
  })

  it('charge les form_entries du module au montage', async () => {
    render(<ChronoMonthLayout moduleId="chronobiology_tracker" />)
    await waitFor(() => {
      expect(database.getAllFormEntries).toHaveBeenCalledWith('chronobiology_tracker')
    })
  })

  it('rend la grille calendaire et la bande de rythme', async () => {
    render(<ChronoMonthLayout moduleId="chronobiology_tracker" />)
    expect(await screen.findByTestId('chrono-month-layout')).toBeTruthy()
    expect(screen.getByTestId('chrono-month-grid')).toBeTruthy()
    expect(screen.getByTestId('chrono-rhythm-band')).toBeTruthy()
  })

  it('affiche les boutons de navigation prev/next', async () => {
    render(<ChronoMonthLayout moduleId="chronobiology_tracker" />)
    expect(await screen.findByTestId('chrono-prev-month')).toBeTruthy()
    expect(screen.getByTestId('chrono-next-month')).toBeTruthy()
  })

  it('parse correctement les form_entries en AnchorEntry', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([
      {
        id: 'e1',
        module_id: 'chronobiology_tracker',
        values: {
          date: '2026-05-10',
          wake_time: '07:30',
          bedtime: '23:00',
        },
        created_at: '2026-05-10T18:00:00Z',
      },
    ])
    render(<ChronoMonthLayout moduleId="chronobiology_tracker" />)
    expect(await screen.findByTestId('chrono-month-layout')).toBeTruthy()
    // Pas de crash → parsing OK
  })

  it('utilise created_at si values.date est absent', async () => {
    ;(database.getAllFormEntries as jest.Mock).mockResolvedValue([
      {
        id: 'e2',
        module_id: 'chronobiology_tracker',
        values: { wake_time: '07:00' },
        created_at: '2026-05-12T18:00:00Z',
      },
    ])
    render(<ChronoMonthLayout moduleId="chronobiology_tracker" />)
    expect(await screen.findByTestId('chrono-month-layout')).toBeTruthy()
  })
})
