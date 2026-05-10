const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockIs = jest.fn()
const mockSingle = jest.fn()
const mockUpdate = jest.fn()
const mockUpdateEq = jest.fn()

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import { supabase } from '../lib/supabase'
import { fetchUnlockedCards, markCardAsRead } from './psychoeducationService'

beforeEach(() => {
  jest.clearAllMocks()
})

function setupReadChain(data: unknown, error: unknown = null) {
  const chain = {
    select: mockSelect.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    is: mockIs.mockReturnThis(),
    single: mockSingle.mockResolvedValue({ data, error }),
  }
  ;(supabase.from as jest.Mock).mockReturnValueOnce(chain)
  return chain
}

describe('psychoeducationService.fetchUnlockedCards', () => {
  it('retourne les cartes débloquées en cas de succès', async () => {
    setupReadChain({ config: { unlocked_cards: [{ card_id: 'a', is_read: false, unlocked_at: '2026-01-01' }] } })

    const result = await fetchUnlockedCards('pat-1')

    expect(result).toEqual({
      ok: true,
      cards: [{ card_id: 'a', is_read: false, unlocked_at: '2026-01-01' }],
    })
  })

  it('retourne un tableau vide si config vide', async () => {
    setupReadChain({ config: {} })

    const result = await fetchUnlockedCards('pat-1')

    expect(result).toEqual({ ok: true, cards: [] })
  })

  it('retourne ok: false en cas d\'erreur Supabase', async () => {
    setupReadChain(null, { message: 'fail' })

    const result = await fetchUnlockedCards('pat-1')

    expect(result).toEqual({ ok: false })
  })
})

describe('psychoeducationService.markCardAsRead', () => {
  it("met à jour is_read uniquement pour la carte ciblée", async () => {
    const cards = [
      { card_id: 'a', is_read: false, unlocked_at: '2026-01-01' },
      { card_id: 'b', is_read: false, unlocked_at: '2026-01-02' },
    ]
    const readChain = {
      select: mockSelect.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      is: mockIs.mockReturnThis(),
      single: mockSingle.mockResolvedValue({ data: { id: 'pm-1', config: { unlocked_cards: cards } }, error: null }),
    }
    const updateChain = {
      update: mockUpdate.mockReturnValue({ eq: mockUpdateEq.mockResolvedValue({ error: null }) }),
    }
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(readChain)
      .mockReturnValueOnce(updateChain)

    await markCardAsRead('pat-1', 'a')

    const updatedConfig = mockUpdate.mock.calls[0][0].config
    expect(updatedConfig.unlocked_cards).toEqual([
      { card_id: 'a', is_read: true,  unlocked_at: '2026-01-01' },
      { card_id: 'b', is_read: false, unlocked_at: '2026-01-02' },
    ])
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'pm-1')
  })

  it("lève une erreur si le module psychoeducation n'existe pas", async () => {
    const readChain = {
      select: mockSelect.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      is: mockIs.mockReturnThis(),
      single: mockSingle.mockResolvedValue({ data: null, error: { message: 'no row' } }),
    }
    ;(supabase.from as jest.Mock).mockReturnValueOnce(readChain)

    await expect(markCardAsRead('pat-1', 'a')).rejects.toBeDefined()
  })
})
