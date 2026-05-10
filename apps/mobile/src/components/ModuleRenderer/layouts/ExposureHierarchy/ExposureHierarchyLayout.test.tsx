jest.mock('../../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

jest.mock('../../../../lib/database', () => ({
  listExposureHierarchies: jest.fn(),
  createExposureHierarchy: jest.fn().mockResolvedValue(undefined),
  deleteExposureHierarchy: jest.fn().mockResolvedValue(undefined),
  getAllFearSituations: jest.fn().mockResolvedValue([]),
  saveFearSituation: jest.fn().mockResolvedValue(undefined),
  deleteFearSituation: jest.fn().mockResolvedValue(undefined),
  getAllFearEntries: jest.fn().mockResolvedValue([]),
  generateId: jest.fn().mockReturnValue('test-id-1'),
}))

jest.mock('../../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { teenMode: boolean }) => unknown) =>
    selector({ teenMode: false }),
}))

jest.mock('react-native-svg', () => {
  const React = require('react')
  const make = (name: string) => (props: Record<string, unknown>) =>
    React.createElement(name, { ...props })
  return new Proxy({}, { get: (_, key) => make(String(key)) })
})

jest.mock('lucide-react-native', () => {
  const React = require('react')
  const Stub = (name: string) => (props: { size?: number; color?: string }) =>
    React.createElement('Icon', { ...props, name })
  return new Proxy({}, { get: (_, key) => Stub(String(key)) })
})

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import { ExposureHierarchyLayout } from './ExposureHierarchyLayout'
import * as database from '../../../../lib/database'

jest.setTimeout(15000)

const HIERARCHIES: database.ExposureHierarchy[] = [
  { id: 'h1', module_id: 'exposure_hierarchy', title: 'Phobie sociale', created_at: '2026-04-01T10:00:00Z' },
  { id: 'h2', module_id: 'exposure_hierarchy', title: 'Agoraphobie', created_at: '2026-04-15T10:00:00Z' },
]

describe('ExposureHierarchyLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(database.listExposureHierarchies as jest.Mock).mockResolvedValue([])
    ;(database.getAllFearSituations as jest.Mock).mockResolvedValue([])
    ;(database.getAllFearEntries as jest.Mock).mockResolvedValue([])
  })

  it('charge les hiérarchies au montage', async () => {
    render(<ExposureHierarchyLayout moduleId="exposure_hierarchy" />)
    await waitFor(() => {
      expect(database.listExposureHierarchies).toHaveBeenCalledWith('exposure_hierarchy')
    })
  })

  it('affiche un état vide si aucune hiérarchie', async () => {
    render(<ExposureHierarchyLayout moduleId="exposure_hierarchy" />)
    expect(await screen.findByTestId('exposure-hierarchies-mode')).toBeTruthy()
    expect(screen.getByTestId('add-hierarchy-fab')).toBeTruthy()
  })

  it('affiche les hiérarchies existantes', async () => {
    ;(database.listExposureHierarchies as jest.Mock).mockResolvedValue(HIERARCHIES)
    render(<ExposureHierarchyLayout moduleId="exposure_hierarchy" />)
    expect(await screen.findByTestId('hierarchy-h1')).toBeTruthy()
    expect(screen.getByTestId('hierarchy-h2')).toBeTruthy()
    expect(screen.getByText('Phobie sociale')).toBeTruthy()
    expect(screen.getByText('Agoraphobie')).toBeTruthy()
  })

  it('drill-in vers les items d\'une hiérarchie au tap', async () => {
    ;(database.listExposureHierarchies as jest.Mock).mockResolvedValue(HIERARCHIES)
    render(<ExposureHierarchyLayout moduleId="exposure_hierarchy" />)
    fireEvent.press(await screen.findByTestId('hierarchy-h1'))
    expect(await screen.findByTestId('exposure-items-mode')).toBeTruthy()
    expect(screen.getByText('Phobie sociale')).toBeTruthy()
  })

  it('crée une nouvelle hiérarchie via le FAB', async () => {
    render(<ExposureHierarchyLayout moduleId="exposure_hierarchy" />)
    fireEvent.press(await screen.findByTestId('add-hierarchy-fab'))
    expect(screen.getByTestId('hierarchy-title-input')).toBeTruthy()
    fireEvent.changeText(screen.getByTestId('hierarchy-title-input'), 'Nouvelle peur')
    await act(async () => {
      fireEvent.press(screen.getByTestId('confirm-create-hierarchy'))
    })
    await waitFor(() => {
      expect(database.createExposureHierarchy).toHaveBeenCalledWith({
        id: 'test-id-1',
        module_id: 'exposure_hierarchy',
        title: 'Nouvelle peur',
      })
    })
  })

  it('back depuis items mode revient en hiérarchies mode', async () => {
    ;(database.listExposureHierarchies as jest.Mock).mockResolvedValue(HIERARCHIES)
    render(<ExposureHierarchyLayout moduleId="exposure_hierarchy" />)
    fireEvent.press(await screen.findByTestId('hierarchy-h1'))
    expect(await screen.findByTestId('exposure-items-mode')).toBeTruthy()
    fireEvent.press(screen.getByTestId('back-to-hierarchies'))
    expect(await screen.findByTestId('exposure-hierarchies-mode')).toBeTruthy()
  })

  it('passe en mode item_form quand on tape sur add-item-fab', async () => {
    ;(database.listExposureHierarchies as jest.Mock).mockResolvedValue(HIERARCHIES)
    render(<ExposureHierarchyLayout moduleId="exposure_hierarchy" />)
    fireEvent.press(await screen.findByTestId('hierarchy-h1'))
    fireEvent.press(await screen.findByTestId('add-item-fab'))
    expect(await screen.findByTestId('exposure-item-form-mode')).toBeTruthy()
  })

  it('sauvegarde un item avec target_suds + hierarchy_id', async () => {
    ;(database.listExposureHierarchies as jest.Mock).mockResolvedValue(HIERARCHIES)
    render(<ExposureHierarchyLayout moduleId="exposure_hierarchy" />)
    fireEvent.press(await screen.findByTestId('hierarchy-h1'))
    fireEvent.press(await screen.findByTestId('add-item-fab'))
    fireEvent.changeText(await screen.findByTestId('item-label-input'), 'Prendre l\'ascenseur')
    await act(async () => {
      fireEvent.press(screen.getByTestId('save-item'))
    })
    await waitFor(() => {
      expect(database.saveFearSituation).toHaveBeenCalledWith({
        id: 'test-id-1',
        label: 'Prendre l\'ascenseur',
        hierarchy_id: 'h1',
        target_suds: 50,
        is_done: 0,
      })
    })
  })
})
