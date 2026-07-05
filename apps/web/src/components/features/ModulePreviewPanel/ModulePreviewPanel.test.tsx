import { vi, beforeEach, describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import type { ContentField, ModuleFieldsResult } from '@services/moduleService'
import { renderWithClient } from '../../../test/renderWithClient'
import { ModulePreviewPanel } from './ModulePreviewPanel'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockFetchModuleFields = vi.fn()
vi.mock('@services/moduleService', () => ({
  fetchModuleFields: (id: string) => mockFetchModuleFields(id),
}))

// FieldRenderer et le panneau de sources ont leurs propres fetchs — stubs pour
// isoler le panneau.
vi.mock('../ModuleRenderer', () => ({
  FieldRenderer: () => <div data-testid="field-renderer" />,
}))
vi.mock('../ModuleSources/ModuleSourcesPanel', () => ({
  ModuleSourcesPanel: () => <div data-testid="sources-panel" />,
}))

function result(fields: ModuleFieldsResult['fields']): ModuleFieldsResult {
  return { preview_kind: 'questionnaire', fields }
}

const FIELD: ContentField = {
  id: 'f1', module_id: 'phq9', section_id: null, parent_field_id: null,
  field_type: 'likert_scale', text_code: 'modules.phq9.q1', sort_order: 1,
  props: {}, children: [],
}

beforeEach(() => vi.clearAllMocks())

describe('ModulePreviewPanel', () => {
  it('affiche le chargement puis le rendu des champs', async () => {
    mockFetchModuleFields.mockResolvedValue(result([FIELD]))
    renderWithClient(<ModulePreviewPanel moduleType="phq9" />)

    expect(screen.getByText('common.loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('field-renderer')).toBeInTheDocument())
    expect(mockFetchModuleFields).toHaveBeenCalledWith('phq9')
  })

  it('affiche « coming soon » quand aucun champ significatif', async () => {
    mockFetchModuleFields.mockResolvedValue({ preview_kind: 'coming_soon', fields: [] })
    renderWithClient(<ModulePreviewPanel moduleType="future_mod" />)

    expect(await screen.findByText('patient.coming_soon')).toBeInTheDocument()
  })

  it('ne re-fetche pas un module déjà en cache au 2e montage (dédup)', async () => {
    mockFetchModuleFields.mockResolvedValue(result([FIELD]))
    const { unmount, queryClient } = renderWithClient(<ModulePreviewPanel moduleType="phq9" />)
    await waitFor(() => expect(mockFetchModuleFields).toHaveBeenCalledTimes(1))
    unmount()

    renderWithClient(<ModulePreviewPanel moduleType="phq9" />, queryClient)
    await waitFor(() => expect(screen.getByTestId('field-renderer')).toBeInTheDocument())
    expect(mockFetchModuleFields).toHaveBeenCalledTimes(1)
  })
})
