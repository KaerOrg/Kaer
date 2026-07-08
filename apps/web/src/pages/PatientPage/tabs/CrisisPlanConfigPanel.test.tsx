import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CrisisPlanConfigPanel } from './CrisisPlanConfigPanel'

type Crisis = React.ComponentProps<typeof CrisisPlanConfigPanel>['crisis']

function makeCrisis(over: Partial<Crisis> = {}): Crisis {
  return {
    open: true,
    config: { practitionerMessage: '' },
    setConfig: vi.fn(),
    saving: false,
    isConfigured: false,
    openEditor: vi.fn(),
    closeEditor: vi.fn(),
    saveEditor: vi.fn().mockResolvedValue(true),
    ...over,
  }
}

beforeEach(() => vi.clearAllMocks())

describe('CrisisPlanConfigPanel', () => {
  it('affiche le titre de l\'éditeur', () => {
    render(<CrisisPlanConfigPanel crisis={makeCrisis()} onClose={vi.fn()} />)
    expect(screen.getByText('patient.crisis_editor_title')).toBeTruthy()
  })

  it('enregistre puis ferme la modale au succès', async () => {
    const crisis = makeCrisis({ saveEditor: vi.fn().mockResolvedValue(true) })
    const onClose = vi.fn()
    render(<CrisisPlanConfigPanel crisis={crisis} onClose={onClose} />)
    fireEvent.click(screen.getByText('patient.crisis_btn_save'))
    await waitFor(() => expect(crisis.saveEditor).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('ne ferme pas la modale si l\'enregistrement échoue', async () => {
    const crisis = makeCrisis({ saveEditor: vi.fn().mockResolvedValue(false) })
    const onClose = vi.fn()
    render(<CrisisPlanConfigPanel crisis={crisis} onClose={onClose} />)
    fireEvent.click(screen.getByText('patient.crisis_btn_save'))
    await waitFor(() => expect(crisis.saveEditor).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('édite le message du praticien', () => {
    const crisis = makeCrisis()
    render(<CrisisPlanConfigPanel crisis={crisis} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('patient.crisis_msg_placeholder'), { target: { value: 'Tu comptes' } })
    expect(crisis.setConfig).toHaveBeenCalled()
  })
})
