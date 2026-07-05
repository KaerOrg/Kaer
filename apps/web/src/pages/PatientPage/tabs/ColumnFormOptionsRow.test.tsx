import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fr' } }),
}))

const mockUpdateEnabledGroups = vi.fn()
vi.mock('@services/moduleAssignmentService', () => ({
  updateEnabledGroups: (...args: unknown[]) => mockUpdateEnabledGroups(...args),
}))

const mockToastError = vi.fn()
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ error: mockToastError }),
}))

import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import type { PatientModule } from '../../../lib/database.types'
import { ColumnFormOptionsRow } from './ColumnFormOptionsRow'

function makeModule(config: Record<string, unknown>): PatientModule {
  return {
    id: 'pm-1',
    patient_id: 'p1',
    practitioner_id: 'pr1',
    module_type: 'beck_columns',
    config,
    unlocked_at: '2026-06-01T00:00:00Z',
  } as PatientModule
}

const onReload = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.clearAllMocks()
  onReload.mockResolvedValue(undefined)
})

describe('ColumnFormOptionsRow', () => {
  it('activé quand le groupe figure dans enabled_groups', () => {
    const { getByRole } = render(
      <ColumnFormOptionsRow mod={makeModule({ enabled_groups: ['evidence'] })} group="evidence" label="Examen des preuves" onReload={onReload} />,
    )
    expect((getByRole('checkbox') as HTMLInputElement).checked).toBe(true)
  })

  it('active le groupe en préservant les autres, puis recharge', async () => {
    mockUpdateEnabledGroups.mockResolvedValue({ ok: true })
    const { getByRole } = render(
      <ColumnFormOptionsRow mod={makeModule({ enabled_groups: ['other'] })} group="evidence" label="Examen des preuves" onReload={onReload} />,
    )

    fireEvent.click(getByRole('checkbox'))

    await waitFor(() => expect(mockUpdateEnabledGroups).toHaveBeenCalledWith('pm-1', ['other', 'evidence']))
    await waitFor(() => expect(onReload).toHaveBeenCalled())
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('désactive le groupe quand il était actif', async () => {
    mockUpdateEnabledGroups.mockResolvedValue({ ok: true })
    const { getByRole } = render(
      <ColumnFormOptionsRow mod={makeModule({ enabled_groups: ['evidence'] })} group="evidence" label="Examen des preuves" onReload={onReload} />,
    )

    fireEvent.click(getByRole('checkbox'))

    await waitFor(() => expect(mockUpdateEnabledGroups).toHaveBeenCalledWith('pm-1', []))
  })

  it('toast d’erreur (sans reload) si la sauvegarde échoue', async () => {
    mockUpdateEnabledGroups.mockResolvedValue({ ok: false })
    const { getByRole } = render(
      <ColumnFormOptionsRow mod={makeModule({})} group="evidence" label="Examen des preuves" onReload={onReload} />,
    )

    fireEvent.click(getByRole('checkbox'))

    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
    expect(onReload).not.toHaveBeenCalled()
  })
})
