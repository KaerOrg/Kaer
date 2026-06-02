// Shared mock chain — supports .order() (fetchUnlockedModules), .contains() (fetchTodayRoutines),
// and .maybeSingle() (fetchModuleEvents)
const mockContains = jest.fn()
const mockOrder = jest.fn()
const mockEq = jest.fn()
const mockMaybeSingle = jest.fn()
const mockSelect = jest.fn()

const chain = { eq: mockEq, order: mockOrder, contains: mockContains, maybeSingle: mockMaybeSingle }
mockEq.mockReturnValue(chain)
mockSelect.mockReturnValue(chain)

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: mockSelect }),
  },
}))

import { fetchUnlockedModules, fetchTodayRoutines, fetchModuleEvents } from './homeService'

beforeEach(() => jest.clearAllMocks())

// ── fetchUnlockedModules ────────────────────────────────────────────────────

describe('homeService.fetchUnlockedModules', () => {
  it('lit patient_modules avec le join modules et trie par unlocked_at asc', async () => {
    const rows = [
      { id: 'pm-1', module_type: 'sleep_diary', config: {}, unlocked_at: '2026-01-01', module: { mobile_icon: 'bed', color: '#fff', preview_kind: 'fields' } },
    ]
    mockOrder.mockResolvedValue({ data: rows, error: null })

    const result = await fetchUnlockedModules('pat-1')

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

// ── fetchTodayRoutines ──────────────────────────────────────────────────────

describe('homeService.fetchTodayRoutines', () => {
  const routine = (overrides: Partial<{
    id: string
    time_of_day: string
    patient_time_override: string | null
    module_type: string
    mobile_icon: string
    preview_kind: string
  }> = {}) => ({
    id: overrides.id ?? 'r-1',
    patient_module_id: 'pm-1',
    time_of_day: overrides.time_of_day ?? '10:00',
    patient_time_override: overrides.patient_time_override ?? null,
    patient_module: {
      module_type: overrides.module_type ?? 'phq9',
      module: {
        mobile_icon: overrides.mobile_icon ?? 'brain',
        preview_kind: overrides.preview_kind ?? 'questionnaire',
      },
    },
  })

  it('filtre sur is_active, patient_paused et le jour ISO courant', async () => {
    mockContains.mockResolvedValue({ data: [], error: null })

    await fetchTodayRoutines('pat-1')

    expect(mockEq).toHaveBeenCalledWith('patient_id', 'pat-1')
    expect(mockEq).toHaveBeenCalledWith('is_active', true)
    expect(mockEq).toHaveBeenCalledWith('patient_paused', false)
    expect(mockContains).toHaveBeenCalledWith('days_of_week', expect.any(Array))

    // La valeur ISO est entre 1 (lun) et 7 (dim)
    const [[, isoArg]] = (mockContains as jest.Mock).mock.calls
    const isoDay: number = isoArg[0]
    expect(isoDay).toBeGreaterThanOrEqual(1)
    expect(isoDay).toBeLessThanOrEqual(7)
  })

  it("mappe correctement les champs et utilise effective_time = time_of_day si pas d'override", async () => {
    mockContains.mockResolvedValue({ data: [routine()], error: null })

    const result = await fetchTodayRoutines('pat-1')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'r-1',
      module_type: 'phq9',
      mobile_icon: 'brain',
      preview_kind: 'questionnaire',
      time_of_day: '10:00',
      patient_time_override: null,
      effective_time: '10:00',
    })
  })

  it('utilise patient_time_override comme effective_time si présent', async () => {
    mockContains.mockResolvedValue({
      data: [routine({ time_of_day: '10:00', patient_time_override: '08:30' })],
      error: null,
    })

    const [result] = await fetchTodayRoutines('pat-1')

    expect(result.effective_time).toBe('08:30')
    expect(result.time_of_day).toBe('10:00')
  })

  it('trie par effective_time ascendant', async () => {
    mockContains.mockResolvedValue({
      data: [
        routine({ id: 'r-late',  time_of_day: '20:00' }),
        routine({ id: 'r-early', time_of_day: '08:00' }),
        routine({ id: 'r-mid',   time_of_day: '14:00' }),
      ],
      error: null,
    })

    const result = await fetchTodayRoutines('pat-1')

    expect(result.map(r => r.id)).toEqual(['r-early', 'r-mid', 'r-late'])
  })

  it('retourne un tableau vide si data est null', async () => {
    mockContains.mockResolvedValue({ data: null, error: null })

    const result = await fetchTodayRoutines('pat-1')

    expect(result).toEqual([])
  })

  it('filtre les lignes sans patient_module', async () => {
    mockContains.mockResolvedValue({
      data: [
        { ...routine(), patient_module: null },
        routine({ id: 'r-ok' }),
      ],
      error: null,
    })

    const result = await fetchTodayRoutines('pat-1')

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r-ok')
  })

  it("utilise l'icône par défaut si module est null dans patient_module", async () => {
    mockContains.mockResolvedValue({
      data: [{
        id: 'r-1',
        patient_module_id: 'pm-1',
        time_of_day: '10:00',
        patient_time_override: null,
        patient_module: { module_type: 'phq9', module: null },
      }],
      error: null,
    })

    const [result] = await fetchTodayRoutines('pat-1')

    expect(result.mobile_icon).toBe('help-circle-outline')
    expect(result.preview_kind).toBe('')
  })
})

// ── fetchModuleEvents ───────────────────────────────────────────────────────

describe('homeService.fetchModuleEvents', () => {
  it('retourne les événements depuis config.events (happy path)', async () => {
    const events = [
      { date: '2026-04-14', label: 'Changement de dose' },
      { date: '2026-03-01', label: 'Nouveau traitement' },
    ]
    mockMaybeSingle.mockResolvedValue({ data: { config: { events } }, error: null })

    const result = await fetchModuleEvents('pat-1', 'medication_side_effects')

    expect(mockEq).toHaveBeenCalledWith('patient_id', 'pat-1')
    expect(mockEq).toHaveBeenCalledWith('module_type', 'medication_side_effects')
    expect(result).toEqual(events)
  })

  it('retourne [] quand config est null', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await fetchModuleEvents('pat-1', 'medication_side_effects')

    expect(result).toEqual([])
  })

  it('retourne [] quand config.events est absent', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { config: {} }, error: null })

    const result = await fetchModuleEvents('pat-1', 'medication_side_effects')

    expect(result).toEqual([])
  })

  it('retourne [] quand config.events n\'est pas un tableau', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { config: { events: 'bad' } }, error: null })

    const result = await fetchModuleEvents('pat-1', 'medication_side_effects')

    expect(result).toEqual([])
  })
})
