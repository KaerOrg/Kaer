const mockInsert = jest.fn()

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({ insert: mockInsert }),
  },
}))

import { logEvent } from './engagementService'

describe('engagementService.logEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  it("insère un signal d'observance avec le bon shape (metadata par défaut = {})", async () => {
    await logEvent('pat-1', 'SAVE_BECK_THOUGHT_RECORD')

    expect(mockInsert).toHaveBeenCalledTimes(1)
    expect(mockInsert).toHaveBeenCalledWith({
      patient_id: 'pat-1',
      event_type: 'SAVE_BECK_THOUGHT_RECORD',
      metadata: {},
    })
  })

  it('passe la metadata fournie telle quelle', async () => {
    await logEvent('pat-1', 'SAVE_FEAR_ENTRY', { module: 'fear_thermometer' })

    expect(mockInsert).toHaveBeenCalledWith({
      patient_id: 'pat-1',
      event_type: 'SAVE_FEAR_ENTRY',
      metadata: { module: 'fear_thermometer' },
    })
  })

  it("avale silencieusement les erreurs (signal non critique)", async () => {
    mockInsert.mockRejectedValue(new Error('network'))

    await expect(logEvent('pat-1', 'SAVE_BREATHING_SESSION')).resolves.toBeUndefined()
  })
})
