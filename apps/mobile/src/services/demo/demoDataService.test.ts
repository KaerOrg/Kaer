const mockGenerate = jest.fn().mockResolvedValue(60)
const mockListIds = jest.fn().mockResolvedValue([])
const mockDelete = jest.fn().mockResolvedValue(undefined)
jest.mock('./sleepDiaryDemoGenerator', () => ({
  sleepDiaryDemoGenerator: {
    module: 'sleep_diary',
    generate: (...a: unknown[]) => mockGenerate(...a),
    listEntryIds: (...a: unknown[]) => mockListIds(...a),
    deleteEntry: (...a: unknown[]) => mockDelete(...a),
  },
}))

import { availableDemoModules, generateDemoForModule, purgeAllDemo } from './demoDataService'

const TEST_CTX = { patientEmail: 'teil.patient@gmail.com' }
const REAL_CTX = { patientEmail: 'vrai.patient@example.com' }

beforeEach(() => jest.clearAllMocks())

describe('demoDataService — availableDemoModules', () => {
  it('expose les modules disposant d\'un générateur', () => {
    expect(availableDemoModules()).toContain('sleep_diary')
  })
})

describe('demoDataService — generateDemoForModule', () => {
  it('génère sur un compte de test', async () => {
    const result = await generateDemoForModule('sleep_diary', TEST_CTX)
    expect(result).toEqual({ ok: true, count: 60 })
    expect(mockGenerate).toHaveBeenCalledTimes(1)
  })

  it('REFUSE hors compte de test (garde RGPD, générateur jamais appelé)', async () => {
    const result = await generateDemoForModule('sleep_diary', REAL_CTX)
    expect(result).toEqual({ ok: false, reason: 'not_test_account' })
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it('refuse un module sans générateur', async () => {
    const result = await generateDemoForModule('phq9', TEST_CTX)
    expect(result).toEqual({ ok: false, reason: 'unknown_module' })
    expect(mockGenerate).not.toHaveBeenCalled()
  })
})

describe('demoDataService — purgeAllDemo', () => {
  it('ne supprime QUE les entrées préfixées demo- (invariant de sûreté central)', async () => {
    mockListIds.mockResolvedValueOnce(['demo-sleep-1', 'real-1', 'demo-sleep-2'])
    const result = await purgeAllDemo(TEST_CTX)
    expect(result).toEqual({ ok: true, count: 2 })
    expect(mockDelete).toHaveBeenCalledWith('demo-sleep-1')
    expect(mockDelete).toHaveBeenCalledWith('demo-sleep-2')
    expect(mockDelete).not.toHaveBeenCalledWith('real-1')
  })

  it('REFUSE hors compte de test (rien listé ni supprimé)', async () => {
    const result = await purgeAllDemo(REAL_CTX)
    expect(result).toEqual({ ok: false, reason: 'not_test_account' })
    expect(mockListIds).not.toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
