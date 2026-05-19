const mockOrder = jest.fn()
const mockEq = jest.fn().mockReturnValue({ order: mockOrder })
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: mockSelect }),
  },
}))

import { fetchUnlockedModules } from './homeService'

describe('homeService.fetchUnlockedModules', () => {
  beforeEach(() => jest.clearAllMocks())

  it('lit patient_modules avec le join modules et trie par unlocked_at asc', async () => {
    const rows = [
      { id: 'pm-1', module_type: 'sleep_diary', config: {}, unlocked_at: '2026-01-01', module: { mobile_icon: 'bed', color: '#fff', preview_kind: 'fields' } },
    ]
    mockOrder.mockResolvedValue({ data: rows, error: null })

    const result = await fetchUnlockedModules('pat-1')

    expect(mockSelect).toHaveBeenCalledWith('*, module:modules(mobile_icon, color, preview_kind)')
    expect(mockEq).toHaveBeenCalledWith('patient_id', 'pat-1')
    expect(mockOrder).toHaveBeenCalledWith('unlocked_at', { ascending: true })
    expect(result).toEqual(rows)
  })

  it('épingle crisis_plan en premier quel que soit unlocked_at', async () => {
    const rows = [
      { id: 'pm-1', module_type: 'sleep_diary',  config: {}, unlocked_at: '2026-01-01', module: { mobile_icon: 'bed',   color: '#fff', preview_kind: 'fields'      } },
      { id: 'pm-2', module_type: 'crisis_plan',   config: {}, unlocked_at: '2026-06-01', module: { mobile_icon: 'alert', color: '#f00', preview_kind: 'custom'       } },
      { id: 'pm-3', module_type: 'mood_tracker',  config: {}, unlocked_at: '2026-03-01', module: { mobile_icon: 'heart', color: '#0f0', preview_kind: 'questionnaire'} },
    ]
    mockOrder.mockResolvedValue({ data: rows, error: null })

    const result = await fetchUnlockedModules('pat-1')

    expect(result[0].module_type).toBe('crisis_plan')
    expect(result[1].module_type).toBe('sleep_diary')
    expect(result[2].module_type).toBe('mood_tracker')
  })

  it('retourne un tableau vide si data est null', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null })

    const result = await fetchUnlockedModules('pat-1')

    expect(result).toEqual([])
  })
})
