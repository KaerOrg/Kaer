const mockFrom = jest.fn()

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

import {
  fetchModuleFields,
  fetchPatientModuleConfig,
} from './moduleService'

interface ChainOpts {
  data?: unknown
  error?: unknown
}

function makeChain({ data = null, error = null }: ChainOpts = {}) {
  const result = { data, error }
  const chain = new Proxy({} as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
      }
      if (!target[prop]) target[prop] = jest.fn().mockReturnValue(chain)
      return target[prop]
    },
  })
  return chain
}

describe('moduleService.fetchModuleFields', () => {
  beforeEach(() => jest.clearAllMocks())

  it("retourne preview_kind = 'coming_soon' et fields = [] quand aucun field n'existe", async () => {
    const moduleChain = makeChain({ data: { preview_kind: 'questionnaire' } })
    const fieldsChain = makeChain({ data: [] })
    mockFrom
      .mockReturnValueOnce(moduleChain)
      .mockReturnValueOnce(fieldsChain)

    const result = await fetchModuleFields('phq9')

    expect(result).toEqual({ preview_kind: 'questionnaire', fields: [] })
  })

  it('hiérarchise correctement les champs parent → enfants et attache leurs props', async () => {
    const moduleChain = makeChain({ data: { preview_kind: 'fields' } })
    const fieldsChain = makeChain({
      data: [
        { id: 'parent', module_id: 'm', section_id: null, parent_field_id: null, field_type: 'card_title', text_code: 't.parent', sort_order: 0 },
        { id: 'child',  module_id: 'm', section_id: null, parent_field_id: 'parent', field_type: 'card_paragraph', text_code: 't.child', sort_order: 1 },
      ],
    })
    const propsChain = makeChain({
      data: [
        { field_id: 'parent', prop_key: 'color', prop_value: '#fff' },
        { field_id: 'parent', prop_key: 'size',  prop_value: 'lg' },
      ],
    })
    mockFrom
      .mockReturnValueOnce(moduleChain)
      .mockReturnValueOnce(fieldsChain)
      .mockReturnValueOnce(propsChain)

    const result = await fetchModuleFields('m')

    expect(result.preview_kind).toBe('fields')
    expect(result.fields).toHaveLength(1)
    expect(result.fields[0].id).toBe('parent')
    expect(result.fields[0].props).toEqual({ color: '#fff', size: 'lg' })
    expect(result.fields[0].children).toHaveLength(1)
    expect(result.fields[0].children[0].id).toBe('child')
  })

  it("retombe sur 'coming_soon' si la table modules ne renvoie rien", async () => {
    const moduleChain = makeChain({ data: null })
    const fieldsChain = makeChain({ data: [] })
    mockFrom
      .mockReturnValueOnce(moduleChain)
      .mockReturnValueOnce(fieldsChain)

    const result = await fetchModuleFields('inconnu')

    expect(result.preview_kind).toBe('coming_soon')
  })
})

describe('moduleService.fetchPatientModuleConfig', () => {
  beforeEach(() => jest.clearAllMocks())

  it("renvoie le champ config si la ligne existe", async () => {
    const chain = makeChain({ data: { config: { alternative_scenario: 'allo' } } })
    mockFrom.mockReturnValueOnce(chain)

    const result = await fetchPatientModuleConfig('pat-1', 'rim')

    expect(result).toEqual({ alternative_scenario: 'allo' })
  })

  it('renvoie null si aucune ligne', async () => {
    const chain = makeChain({ data: null })
    mockFrom.mockReturnValueOnce(chain)

    const result = await fetchPatientModuleConfig('pat-1', 'rim')

    expect(result).toBeNull()
  })
})
