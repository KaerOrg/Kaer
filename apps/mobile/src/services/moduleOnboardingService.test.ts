const mockGet = jest.fn()
const mockSet = jest.fn()

jest.mock('../lib/database', () => ({
  getModuleSetting: (...a: unknown[]) => mockGet(...a),
  setModuleSetting: (...a: unknown[]) => mockSet(...a),
}))

import { hasSeenModuleOnboarding, markModuleOnboardingSeen } from './moduleOnboardingService'

describe('moduleOnboardingService', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockSet.mockReset().mockResolvedValue(undefined)
  })

  it('renvoie false quand aucun passage n\'est mémorisé', async () => {
    mockGet.mockResolvedValue(null)
    expect(await hasSeenModuleOnboarding('emotion_wheel')).toBe(false)
    expect(mockGet).toHaveBeenCalledWith('emotion_wheel', 'onboarding_seen')
  })

  it('renvoie true une fois le passage mémorisé', async () => {
    mockGet.mockResolvedValue('1')
    expect(await hasSeenModuleOnboarding('emotion_wheel')).toBe(true)
  })

  it('ne considère pas une valeur inattendue comme « déjà vu »', async () => {
    mockGet.mockResolvedValue('0')
    expect(await hasSeenModuleOnboarding('emotion_wheel')).toBe(false)
  })

  it('mémorise le passage sous une clé propre au module', async () => {
    await markModuleOnboardingSeen('emotion_wheel')
    expect(mockSet).toHaveBeenCalledWith('emotion_wheel', 'onboarding_seen', '1')
  })

  it('propage l\'échec d\'écriture plutôt que de le taire', async () => {
    mockSet.mockRejectedValue(new Error('sqlite down'))
    await expect(markModuleOnboardingSeen('emotion_wheel')).rejects.toThrow('sqlite down')
  })
})
