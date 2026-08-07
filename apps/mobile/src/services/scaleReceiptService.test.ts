const mockNot = jest.fn()
const mockEq2 = jest.fn(() => ({ not: mockNot }))
const mockEq1 = jest.fn(() => ({ eq: mockEq2 }))
const mockSelect = jest.fn(() => ({ eq: mockEq1 }))
const mockFrom = jest.fn(() => ({ select: mockSelect }))

jest.mock('../lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...(args as [])) },
}))

import { fetchScaleReadReceipts } from './scaleReceiptService'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('scaleReceiptService.fetchScaleReadReceipts', () => {
  it('indexe les accusés par identifiant local de passation', async () => {
    mockNot.mockResolvedValue({
      data: [
        { local_id: 'entry-1', practitioner_read_at: '2026-07-29T08:00:00Z' },
        { local_id: 'entry-2', practitioner_read_at: '2026-08-02T10:30:00Z' },
      ],
      error: null,
    })

    const receipts = await fetchScaleReadReceipts('phq9')

    expect(mockFrom).toHaveBeenCalledWith('patient_entries')
    expect(receipts.get('entry-1')).toBe('2026-07-29T08:00:00Z')
    expect(receipts.get('entry-2')).toBe('2026-08-02T10:30:00Z')
  })

  it('ne demande que les passations de l\'échelle, et seulement celles qui sont ouvertes', () => {
    // Le filtre serveur évite de rapatrier des lignes nulles pour rien, mais surtout il
    // dit l'intention : on ne s'intéresse qu'aux passations réellement ouvertes.
    mockNot.mockResolvedValue({ data: [], error: null })

    void fetchScaleReadReceipts('gad7')

    expect(mockSelect).toHaveBeenCalledWith('local_id, practitioner_read_at')
    expect(mockEq1).toHaveBeenCalledWith('entry_kind', 'scale_entry')
    expect(mockEq2).toHaveBeenCalledWith('module_id', 'gad7')
    expect(mockNot).toHaveBeenCalledWith('practitioner_read_at', 'is', null)
  })

  it('ignore une ligne sans date plutôt que d\'inventer un accusé', async () => {
    mockNot.mockResolvedValue({
      data: [
        { local_id: 'entry-1', practitioner_read_at: null },
        { local_id: 'entry-2', practitioner_read_at: '2026-08-02T10:30:00Z' },
      ],
      error: null,
    })

    const receipts = await fetchScaleReadReceipts('phq9')

    expect(receipts.has('entry-1')).toBe(false)
    expect(receipts.size).toBe(1)
  })

  it('retombe sur une map vide en cas d\'erreur : aucun accusé inventé hors ligne', async () => {
    // Hors ligne, on ne sait pas. Ne rien afficher est la bonne réponse : le patient ne
    // doit pas lire « Vu par votre soignant » sur la foi d'un cache ou d'un défaut.
    mockNot.mockResolvedValue({ data: null, error: new Error('offline') })

    expect((await fetchScaleReadReceipts('phq9')).size).toBe(0)
  })
})
