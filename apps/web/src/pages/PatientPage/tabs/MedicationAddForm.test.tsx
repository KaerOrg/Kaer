import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

import { render, screen, fireEvent } from '@testing-library/react'
import { MedicationAddForm } from './MedicationAddForm'

describe('MedicationAddForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rend les deux champs et le sélecteur de type', () => {
    render(<MedicationAddForm onAdd={vi.fn()} />)
    expect(screen.getByPlaceholderText('modules.medication_adherence.med_name')).toBeTruthy()
    expect(screen.getByPlaceholderText('modules.medication_adherence.med_posology')).toBeTruthy()
    expect(screen.getByText('modules.medication_adherence.kind_maintenance')).toBeTruthy()
    expect(screen.getByText('modules.medication_adherence.kind_prn')).toBeTruthy()
  })

  it('ajoute une molécule au clic (nom + posologie + type sélectionné)', () => {
    const onAdd = vi.fn()
    render(<MedicationAddForm onAdd={onAdd} />)
    fireEvent.change(screen.getByPlaceholderText('modules.medication_adherence.med_name'), { target: { value: 'Sertraline' } })
    fireEvent.change(screen.getByPlaceholderText('modules.medication_adherence.med_posology'), { target: { value: '50 mg' } })
    fireEvent.click(screen.getByText('modules.medication_adherence.kind_prn'))
    fireEvent.click(screen.getByText('modules.medication_adherence.meds_add'))
    expect(onAdd).toHaveBeenCalledWith({ name: 'Sertraline', posology: '50 mg', kind: 'prn' })
  })

  it('ignore un nom vide ou en blanc', () => {
    const onAdd = vi.fn()
    render(<MedicationAddForm onAdd={onAdd} />)
    fireEvent.change(screen.getByPlaceholderText('modules.medication_adherence.med_name'), { target: { value: '   ' } })
    fireEvent.click(screen.getByText('modules.medication_adherence.meds_add'))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('valide aussi à la touche Entrée et réinitialise les champs', () => {
    const onAdd = vi.fn()
    render(<MedicationAddForm onAdd={onAdd} />)
    const nameInput = screen.getByPlaceholderText('modules.medication_adherence.med_name') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Quétiapine' } })
    fireEvent.keyDown(nameInput, { key: 'Enter' })
    expect(onAdd).toHaveBeenCalledWith({ name: 'Quétiapine', posology: '', kind: 'maintenance' })
    expect(nameInput.value).toBe('')
  })
})
