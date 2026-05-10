import { fetchTopicsByModule, fetchBlocksByTopic, clearPsyEduCache } from './psyeduService'

const mockBuilder = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
}

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockBuilder),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { supabase } = require('../lib/supabase')

const MOCK_TOPICS = [
  { id: 'uuid-1', module_key: 'diet_weight_psycho', topic_key: 'sleep_chrono', icon_name: 'Moon', sort_order: 1, is_active: true },
  { id: 'uuid-2', module_key: 'diet_weight_psycho', topic_key: 'nutrition_brain', icon_name: 'Apple', sort_order: 2, is_active: true },
]

const MOCK_BLOCKS = [
  { id: 'b1', topic_id: 'uuid-1', section_key: 'why', block_type: 'paragraph', text_code: 'diet_weight_psycho.sleep_chrono.why.p1', items_codes: null, href: null, sort_order: 1 },
  { id: 'b2', topic_id: 'uuid-1', section_key: 'how', block_type: 'paragraph', text_code: 'diet_weight_psycho.sleep_chrono.how.intro', items_codes: null, href: null, sort_order: 1 },
]

beforeEach(() => {
  clearPsyEduCache()
  jest.clearAllMocks()
  mockBuilder.select.mockReturnThis()
  mockBuilder.eq.mockReturnThis()
  mockBuilder.order.mockReturnThis()
})

describe('fetchTopicsByModule', () => {
  it('retourne les topics depuis Supabase', async () => {
    mockBuilder.order.mockResolvedValueOnce({ data: MOCK_TOPICS, error: null })
    const result = await fetchTopicsByModule('diet_weight_psycho')
    expect(result).toEqual(MOCK_TOPICS)
    expect(supabase.from).toHaveBeenCalledWith('psyedu_topics')
  })

  it("utilise le cache lors d'un deuxième appel", async () => {
    mockBuilder.order.mockResolvedValueOnce({ data: MOCK_TOPICS, error: null })
    await fetchTopicsByModule('diet_weight_psycho')
    const result2 = await fetchTopicsByModule('diet_weight_psycho')
    expect(result2).toEqual(MOCK_TOPICS)
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('lève une erreur si Supabase échoue', async () => {
    const err = new Error('Supabase error')
    mockBuilder.order.mockResolvedValueOnce({ data: null, error: err })
    await expect(fetchTopicsByModule('diet_weight_psycho')).rejects.toThrow('Supabase error')
  })

  it('filtre uniquement les topics actifs via la requête', async () => {
    mockBuilder.order.mockResolvedValueOnce({ data: MOCK_TOPICS, error: null })
    await fetchTopicsByModule('diet_weight_psycho')
    expect(mockBuilder.eq).toHaveBeenCalledWith('is_active', true)
  })
})

// fetchBlocksByTopic uses .order() twice (section_key then sort_order)
// → first .order() must return the builder so the second can chain
function setupBlocksQuery(result: { data: unknown; error: unknown }) {
  mockBuilder.order
    .mockReturnValueOnce(mockBuilder)
    .mockResolvedValueOnce(result)
}

describe('fetchBlocksByTopic', () => {
  it('retourne les blocks depuis Supabase', async () => {
    setupBlocksQuery({ data: MOCK_BLOCKS, error: null })
    const result = await fetchBlocksByTopic('uuid-1')
    expect(result).toEqual(MOCK_BLOCKS)
    expect(supabase.from).toHaveBeenCalledWith('psyedu_blocks')
  })

  it("utilise le cache lors d'un deuxième appel", async () => {
    setupBlocksQuery({ data: MOCK_BLOCKS, error: null })
    await fetchBlocksByTopic('uuid-1')
    const result2 = await fetchBlocksByTopic('uuid-1')
    expect(result2).toEqual(MOCK_BLOCKS)
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('lève une erreur si Supabase échoue', async () => {
    const err = new Error('Network failure')
    setupBlocksQuery({ data: null, error: err })
    await expect(fetchBlocksByTopic('uuid-1')).rejects.toThrow('Network failure')
  })

  it('filtre par topic_id', async () => {
    setupBlocksQuery({ data: MOCK_BLOCKS, error: null })
    await fetchBlocksByTopic('uuid-1')
    expect(mockBuilder.eq).toHaveBeenCalledWith('topic_id', 'uuid-1')
  })
})

describe('clearPsyEduCache', () => {
  it('force un nouvel appel Supabase après vidage du cache', async () => {
    mockBuilder.order
      .mockResolvedValueOnce({ data: MOCK_TOPICS, error: null })
      .mockResolvedValueOnce({ data: MOCK_TOPICS, error: null })
    await fetchTopicsByModule('diet_weight_psycho')
    clearPsyEduCache()
    await fetchTopicsByModule('diet_weight_psycho')
    expect(supabase.from).toHaveBeenCalledTimes(2)
  })
})

describe('Conformité MDR — pas de logique décisionnelle clinique', () => {
  it('le service ne contient aucun seuil conditionnel sur les données cliniques', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path')
    const src = fs.readFileSync(path.join(__dirname, 'psyeduService.ts'), 'utf8')
    expect(src).not.toMatch(/if\s*\(score\s*[><=]/i)
    expect(src).not.toMatch(/score\s*[><=]\s*\d/i)
    expect(src).not.toMatch(/alerte automatique/i)
  })
})
