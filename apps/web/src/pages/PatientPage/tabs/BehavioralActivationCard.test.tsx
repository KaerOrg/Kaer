import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'fr' } }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { BehavioralActivationCard } from './BehavioralActivationCard'
import type { PatientModule } from '../../../lib/database.types'
import type { ModuleItem } from '@services/moduleCatalogService'
import type { BAConfiguredActivity } from '@kaer/shared'

const MOD_ITEM: ModuleItem = { id: 'behavioral_activation', icon: 'activity', mobile_icon: 'activity', color: '#2C6E72' }
const MOD: PatientModule = {
  id: 'pm1', patient_id: 'p1', practitioner_id: 'pr1',
  module_type: 'behavioral_activation', config: {}, unlocked_at: '2026-06-01T00:00:00Z',
}
const ACT: BAConfiguredActivity = {
  id: 'a1', label: 'Marcher', domain_id: 'al.dom_body', value_text: 'Prendre soin de moi',
}

type BAList = React.ComponentProps<typeof BehavioralActivationCard>['baList']

function makeBAList(over: Partial<BAList> = {}): BAList {
  return {
    module: MOD,
    open: false,
    activities: [],
    domains: [{ id: 'al.dom_body', textCode: 'modules.behavioral_activation.domain_body' }],
    saving: false,
    openEditor: vi.fn(),
    close: vi.fn(),
    addActivity: vi.fn(),
    removeActivity: vi.fn(),
    ...over,
  }
}

function setup(over: Partial<React.ComponentProps<typeof BehavioralActivationCard>> = {}) {
  const props: React.ComponentProps<typeof BehavioralActivationCard> = {
    tagChips: null,
    modItem: MOD_ITEM,
    modIcon: null,
    mod: MOD,
    unlocked: true,
    loading: false,
    previewOpen: false,
    dataOpen: false,
    baList: makeBAList(),
    moduleToggle: (_on, _loading, onToggle) => (
      <button data-testid="module-toggle" onClick={onToggle}>toggle</button>
    ),
    onTogglePreview: vi.fn(),
    onToggleData: vi.fn(),
    onConfigureNotif: vi.fn(),
    onUnlock: vi.fn(),
    onRevoke: vi.fn(),
    ...over,
  }
  render(<BehavioralActivationCard {...props} />)
  return props
}

describe('BehavioralActivationCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rend le label, la description et les actions quand débloqué', () => {
    setup()
    expect(screen.getByText('modules.behavioral_activation.label')).toBeTruthy()
    expect(screen.getByText('modules.behavioral_activation.description')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'patient.preview_button' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'patient.data_button' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'modules.behavioral_activation.config_button' })).toBeTruthy()
  })

  it('le bouton aperçu déclenche onTogglePreview', () => {
    const { onTogglePreview } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'patient.preview_button' }))
    expect(onTogglePreview).toHaveBeenCalledWith('behavioral_activation')
  })

  it('le bouton données déclenche onToggleData', () => {
    const { onToggleData } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'patient.data_button' }))
    expect(onToggleData).toHaveBeenCalledWith('behavioral_activation')
  })

  it('le bouton configurer ouvre l\'éditeur', () => {
    const baList = makeBAList()
    setup({ baList })
    fireEvent.click(screen.getByRole('button', { name: 'modules.behavioral_activation.config_button' }))
    expect(baList.openEditor).toHaveBeenCalled()
  })

  it('la bascule révoque le module débloqué et ferme l\'éditeur', () => {
    const baList = makeBAList()
    const { onRevoke } = setup({ baList })
    fireEvent.click(screen.getByTestId('module-toggle'))
    expect(baList.close).toHaveBeenCalled()
    expect(onRevoke).toHaveBeenCalledWith('pm1')
  })

  it('éditeur ouvert : liste les activités co-construites et supprime par id', () => {
    const baList = makeBAList({ open: true, activities: [ACT] })
    setup({ baList })
    expect(screen.getByText('Marcher')).toBeTruthy()
    expect(screen.getByText('Prendre soin de moi')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('common.delete'))
    expect(baList.removeActivity).toHaveBeenCalledWith('a1')
  })
})
