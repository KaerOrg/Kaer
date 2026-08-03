import { screen } from '@testing-library/react'
import { renderWithClient } from '../../../test/renderWithClient'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@services/moduleCatalogService', () => ({
  fetchModuleTaxonomy: vi.fn(),
}))

vi.mock('@services/moduleService', () => ({
  fetchModuleFields: vi.fn(),
}))

import { fetchModuleTaxonomy } from '@services/moduleCatalogService'
import { fetchModuleFields } from '@services/moduleService'
import { ModuleIndicationsBlock } from './ModuleIndicationsBlock'

const mockedTaxonomy = vi.mocked(fetchModuleTaxonomy)
const mockedFields = vi.mocked(fetchModuleFields)

const TAXONOMY = {
  dimensions: [],
  tagsByDimension: new Map([
    ['indication', [{ id: 'anxiety', dimension_id: 'indication', sort_order: 1 }]],
    ['population', [{ id: 'adults', dimension_id: 'population', sort_order: 1 }]],
    ['approach', [{ id: 'cbt', dimension_id: 'approach', sort_order: 1 }]],
  ]),
  tagsByModule: new Map([['emotion_wheel', new Set(['anxiety', 'adults', 'cbt'])]]),
}

const FIELDS = {
  preview_kind: 'tree_selector',
  fields: [
    { id: 'ew.footer', module_id: 'emotion_wheel', field_type: 'footer_note', text_code: 'modules.emotion_wheel.footer', sort_order: 999, props: {} },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedTaxonomy.mockResolvedValue(TAXONOMY as never)
  mockedFields.mockResolvedValue(FIELDS as never)
})

describe('ModuleIndicationsBlock', () => {
  it('lit les puces dans la TAXONOMIE, jamais une liste écrite en dur', async () => {
    renderWithClient(<ModuleIndicationsBlock moduleId="emotion_wheel" />)

    expect(await screen.findByText('tags.anxiety.label')).toBeInTheDocument()
    expect(screen.getByText('tags.adults.label')).toBeInTheDocument()
    expect(mockedTaxonomy).toHaveBeenCalled()
  })

  it('affiche les deux dimensions du panneau, et elles seules', async () => {
    renderWithClient(<ModuleIndicationsBlock moduleId="emotion_wheel" />)

    expect(await screen.findByText('tag_dimensions.indication.label')).toBeInTheDocument()
    expect(screen.getByText('tag_dimensions.population.label')).toBeInTheDocument()
    // Le module porte aussi un tag d'approche : il sert aux filtres, pas au panneau.
    expect(screen.queryByText('tags.cbt.label')).toBeNull()
  })

  it('rend la mention du module depuis son champ footer_note, pas en dur', async () => {
    renderWithClient(<ModuleIndicationsBlock moduleId="emotion_wheel" />)
    expect(await screen.findByText('modules.emotion_wheel.footer')).toBeInTheDocument()
  })

  it('n\'affiche aucun bloc pour un module sans tag', async () => {
    renderWithClient(<ModuleIndicationsBlock moduleId="sans_tag" />)
    // Laisse les deux queries se résoudre avant de conclure à l'absence.
    await vi.waitFor(() => expect(mockedTaxonomy).toHaveBeenCalled())
    expect(screen.queryByTestId('module-indications')).toBeNull()
  })

  it('rend les puces même si le module n\'a pas de champ footer_note', async () => {
    mockedFields.mockResolvedValue({ preview_kind: 'coming_soon', fields: [] } as never)
    renderWithClient(<ModuleIndicationsBlock moduleId="emotion_wheel" />)

    expect(await screen.findByText('tags.anxiety.label')).toBeInTheDocument()
    expect(screen.queryByText('modules.emotion_wheel.footer')).toBeNull()
  })
})
