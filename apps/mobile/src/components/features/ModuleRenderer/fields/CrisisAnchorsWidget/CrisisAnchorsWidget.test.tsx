jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react')
  return {
    useFocusEffect: (cb: () => unknown) => {
      ReactLib.useEffect(() => cb(), [])
    },
  }
})

jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))

jest.mock('../../../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { patient: { id: string } }) => unknown) =>
    selector({ patient: { id: 'patient-1' } }),
}))

const mockShowToast = jest.fn()
jest.mock('../../../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

const mockShowConfirm = jest.fn()
jest.mock('../../../../../contexts/ConfirmDialogContext', () => ({
  useConfirmDialog: () => ({ showConfirm: mockShowConfirm }),
}))

jest.mock('@services/crisisPlanService', () => ({
  getAnchors: jest.fn(),
  getAnchorPhrase: jest.fn(),
  fetchPractitionerConfig: jest.fn(),
  pickAndSaveAnchorPhoto: jest.fn(),
  removeAnchorPhoto: jest.fn(),
  saveAnchorPhrase: jest.fn(),
}))

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons')

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { CrisisAnchorsWidget } from './CrisisAnchorsWidget'
import * as service from '@services/crisisPlanService'

const svc = service as jest.Mocked<typeof service>

beforeEach(() => {
  jest.clearAllMocks()
  svc.getAnchors.mockResolvedValue([])
  svc.getAnchorPhrase.mockResolvedValue('')
  svc.fetchPractitionerConfig.mockResolvedValue({ practitionerMessage: '' })
  svc.pickAndSaveAnchorPhoto.mockResolvedValue(null)
  svc.removeAnchorPhoto.mockResolvedValue(undefined)
  svc.saveAnchorPhrase.mockResolvedValue(undefined)
})

describe('CrisisAnchorsWidget', () => {
  it('charge ancres, phrase et message praticien au montage', async () => {
    render(<CrisisAnchorsWidget />)
    await waitFor(() => {
      expect(svc.getAnchors).toHaveBeenCalled()
      expect(svc.getAnchorPhrase).toHaveBeenCalled()
      expect(svc.fetchPractitionerConfig).toHaveBeenCalledWith('patient-1')
    })
    expect(screen.getByText('modules.crisis_plan.anchors_title')).toBeTruthy()
  })

  it('affiche le message du praticien quand présent', async () => {
    svc.fetchPractitionerConfig.mockResolvedValue({ practitionerMessage: 'Tiens bon' })
    render(<CrisisAnchorsWidget />)
    expect(await screen.findByText('Tiens bon')).toBeTruthy()
  })

  it('passe en mode édition et sauvegarde la phrase d\'ancrage', async () => {
    render(<CrisisAnchorsWidget />)
    await waitFor(() => expect(svc.getAnchorPhrase).toHaveBeenCalled())

    fireEvent.press(screen.getByLabelText('modules.crisis_plan.anchor_phrase_label'))
    const input = screen.getByPlaceholderText('modules.crisis_plan.anchor_phrase_placeholder')
    fireEvent.changeText(input, 'Ma raison de tenir')
    fireEvent.press(screen.getByText('modules.crisis_plan.anchor_phrase_save'))

    await waitFor(() => expect(svc.saveAnchorPhrase).toHaveBeenCalledWith('Ma raison de tenir'))
  })

  it('toast d\'erreur si l\'ajout de photo échoue', async () => {
    svc.pickAndSaveAnchorPhoto.mockRejectedValue(new Error('boom'))
    render(<CrisisAnchorsWidget />)
    await waitFor(() => expect(svc.getAnchors).toHaveBeenCalled())
    fireEvent.press(screen.getByLabelText('modules.crisis_plan.add_photo'))
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('modules.crisis_plan.photo_error', 'error'))
  })
})
