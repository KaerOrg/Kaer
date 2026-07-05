import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

import { render, screen, fireEvent } from '@testing-library/react'
import { BAActivityAddForm } from './BAActivityAddForm'
import type { BADomainOption } from '../hooks/useBAActivitiesEditor'

const DOMAINS: BADomainOption[] = [
  { id: 'al.dom_body', textCode: 'modules.behavioral_activation.domain_body' },
  { id: 'al.dom_social', textCode: 'modules.behavioral_activation.domain_social' },
]

const labelPlaceholder = 'modules.behavioral_activation.config_activity_placeholder'
const valuePlaceholder = 'modules.behavioral_activation.config_value_placeholder'
const addLabel = 'modules.behavioral_activation.config_add'

describe('BAActivityAddForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rend les champs et un bouton d\'ajout désactivé au départ', () => {
    render(<BAActivityAddForm domains={DOMAINS} onAdd={vi.fn()} />)
    expect(screen.getByPlaceholderText(labelPlaceholder)).toBeTruthy()
    expect(screen.getByPlaceholderText(valuePlaceholder)).toBeTruthy()
    expect(screen.getByRole('button', { name: addLabel })).toBeDisabled()
  })

  it('ajoute une activité (label + domaine + phrase valeur)', () => {
    const onAdd = vi.fn()
    render(<BAActivityAddForm domains={DOMAINS} onAdd={onAdd} />)
    fireEvent.change(screen.getByPlaceholderText(labelPlaceholder), { target: { value: 'Marcher' } })
    fireEvent.change(screen.getByPlaceholderText(valuePlaceholder), { target: { value: 'Prendre soin de moi' } })
    // Sélection du domaine via le Dropdown (searchable=false : clic ouvre la liste).
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.pointerDown(screen.getByRole('option', { name: 'modules.behavioral_activation.domain_body' }))
    fireEvent.click(screen.getByRole('button', { name: addLabel }))
    expect(onAdd).toHaveBeenCalledWith({ label: 'Marcher', domainId: 'al.dom_body', valueText: 'Prendre soin de moi' })
  })

  it('n\'ajoute pas sans domaine sélectionné', () => {
    const onAdd = vi.fn()
    render(<BAActivityAddForm domains={DOMAINS} onAdd={onAdd} />)
    const labelInput = screen.getByPlaceholderText(labelPlaceholder)
    fireEvent.change(labelInput, { target: { value: 'Marcher' } })
    fireEvent.keyDown(labelInput, { key: 'Enter' })
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: addLabel })).toBeDisabled()
  })

  it('réinitialise le champ label après un ajout', () => {
    const onAdd = vi.fn()
    render(<BAActivityAddForm domains={DOMAINS} onAdd={onAdd} />)
    const labelInput = screen.getByPlaceholderText(labelPlaceholder) as HTMLInputElement
    fireEvent.change(labelInput, { target: { value: 'Lire' } })
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.pointerDown(screen.getByRole('option', { name: 'modules.behavioral_activation.domain_social' }))
    fireEvent.click(screen.getByRole('button', { name: addLabel }))
    expect(onAdd).toHaveBeenCalled()
    expect(labelInput.value).toBe('')
  })
})
