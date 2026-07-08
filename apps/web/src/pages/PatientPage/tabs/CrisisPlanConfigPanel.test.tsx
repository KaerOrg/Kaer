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
    config: { practitionerMessage: '', copingCards: [], commitmentPhrase: '' },
    setConfig: vi.fn(),
    cardDraft: null,
    setCardDraft: vi.fn(),
    saving: false,
    isConfigured: false,
    openEditor: vi.fn(),
    closeEditor: vi.fn(),
    saveEditor: vi.fn().mockResolvedValue(true),
    addCopingCard: vi.fn(),
    removeCopingCard: vi.fn(),
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

  it('supprime une coping card par id', () => {
    const crisis = makeCrisis({
      config: { practitionerMessage: '', commitmentPhrase: '', copingCards: [{ id: 'c1', thought: 'a', response: 'b' }] },
    })
    render(<CrisisPlanConfigPanel crisis={crisis} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('patient.crisis_card_delete'))
    expect(crisis.removeCopingCard).toHaveBeenCalledWith('c1')
  })
})
