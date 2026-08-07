import { fetchScaleSchedule, fetchScaleSchedules } from './scaleScheduleService'

const mockMaybeSingle = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockFrom = jest.fn()

jest.mock('../lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}))

// Le patient n'a QUE la lecture sur `scale_schedules` : un espion sur `enqueue`
// vérifie qu'aucune écriture ne part par la couche de sync.
const mockEnqueue = jest.fn()
jest.mock('./sync', () => ({
  RemoteSyncService: { getInstance: () => ({ enqueue: mockEnqueue }) },
}))

const ROW = {
  module_id: 'phq9',
  mode: 'home',
  frequency: 'biweekly',
  day_of_week: 3,
  time_of_day: '19:00',
  ends_on: null,
  patient_reminder: true,
  created_at: '2026-07-01T09:00:00.000Z',
}

/** Chaîne `.select().eq().eq().maybeSingle()` du cas « une échelle ». */
function chainSingle(result: { data: unknown; error: unknown }) {
  mockMaybeSingle.mockResolvedValue(result)
  const second = { maybeSingle: mockMaybeSingle }
  const first = { eq: jest.fn().mockReturnValue(second) }
  mockEq.mockReturnValue(first)
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect })
}

/** Chaîne `.select().eq()` du cas « toutes les échelles ». */
function chainList(result: { data: unknown }) {
  mockEq.mockResolvedValue(result)
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect })
}

describe('scaleScheduleService.fetchScaleSchedule', () => {
  beforeEach(() => jest.clearAllMocks())

  it('rend la programmation proposée par le praticien', async () => {
    chainSingle({ data: ROW, error: null })
    await expect(fetchScaleSchedule('pat-1', 'phq9')).resolves.toEqual({
      moduleId: 'phq9', mode: 'home', frequency: 'biweekly',
      dayOfWeek: 3, timeOfDay: '19:00', endsOn: null, patientReminder: true,
      createdAtIso: '2026-07-01T09:00:00.000Z',
    })
    expect(mockFrom).toHaveBeenCalledWith('scale_schedules')
  })

  it('rend null quand aucune cadence n\'est programmée', async () => {
    // Cas NOMINAL : une échelle peut être débloquée sans cadence.
    chainSingle({ data: null, error: null })
    await expect(fetchScaleSchedule('pat-1', 'phq9')).resolves.toBeNull()
  })

  it('rend null sur erreur, plutôt que de propager', async () => {
    chainSingle({ data: null, error: { message: 'rls' } })
    await expect(fetchScaleSchedule('pat-1', 'phq9')).resolves.toBeNull()
  })

  it('retombe sur « à la demande » devant une cadence inconnue', async () => {
    // Mieux vaut une proposition sans cadence qu'un libellé faux.
    chainSingle({ data: { ...ROW, frequency: 'fortnightly' }, error: null })
    const schedule = await fetchScaleSchedule('pat-1', 'phq9')
    expect(schedule?.frequency).toBe('on_demand')
  })

  it('retombe sur le mode domicile devant un mode inconnu', async () => {
    chainSingle({ data: { ...ROW, mode: 'nowhere' }, error: null })
    expect((await fetchScaleSchedule('pat-1', 'phq9'))?.mode).toBe('home')
  })

  it('n\'écrit rien : le patient n\'a que la lecture', async () => {
    chainSingle({ data: ROW, error: null })
    await fetchScaleSchedule('pat-1', 'phq9')
    expect(mockEnqueue).not.toHaveBeenCalled()
  })
})

describe('scaleScheduleService.fetchScaleSchedules', () => {
  beforeEach(() => jest.clearAllMocks())

  it('indexe les programmations par module', async () => {
    chainList({ data: [ROW, { ...ROW, module_id: 'gad7', frequency: 'weekly' }] })
    const byModule = await fetchScaleSchedules('pat-1')
    expect(byModule.size).toBe(2)
    expect(byModule.get('phq9')?.frequency).toBe('biweekly')
    expect(byModule.get('gad7')?.frequency).toBe('weekly')
  })

  it('rend une map vide quand le patient n\'a aucune programmation', async () => {
    chainList({ data: null })
    expect((await fetchScaleSchedules('pat-1')).size).toBe(0)
  })
})
