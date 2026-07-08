import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { MedicationListConfigPanel } from './MedicationListConfigPanel'

type MedList = React.ComponentProps<typeof MedicationListConfigPanel>['medList']

function makeMedList(over: Partial<MedList> = {}): MedList {
  return {
    module: undefined,
    open: true,
    medications: [],
    saving: false,
    openEditor: vi.fn(),
    close: vi.fn(),
    addMedication: vi.fn(),
    removeMedication: vi.fn(),
    ...over,
  }
}

beforeEach(() => vi.clearAllMocks())

describe('MedicationListConfigPanel', () => {
  it('affiche le message vide sans médicament', () => {
    render(<MedicationListConfigPanel medList={makeMedList()} onClose={vi.fn()} />)
    expect(screen.getByText('modules.medication_adherence.meds_empty')).toBeTruthy()
  })

  it('liste les molécules et supprime par id', () => {
    const medList = makeMedList({ medications: [{ id: 'm1', name: 'Sertraline', posology: '50 mg', kind: 'maintenance' }] })
    render(<MedicationListConfigPanel medList={medList} onClose={vi.fn()} />)
    expect(screen.getByText('Sertraline')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('common.delete'))
    expect(medList.removeMedication).toHaveBeenCalledWith('m1')
  })

  it('« Terminé » ferme la modale', () => {
    const onClose = vi.fn()
    render(<MedicationListConfigPanel medList={makeMedList()} onClose={onClose} />)
    fireEvent.click(screen.getByText('common.done'))
    expect(onClose).toHaveBeenCalled()
  })
})
