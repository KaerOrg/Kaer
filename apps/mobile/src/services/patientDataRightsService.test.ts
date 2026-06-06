const mockRpc = jest.fn()
const mockInvoke = jest.fn()
jest.mock('../lib/supabase', () => ({
  supabase: { rpc: (...a: unknown[]) => mockRpc(...a), functions: { invoke: (...a: unknown[]) => mockInvoke(...a) } },
}))

const mockPurge = jest.fn().mockResolvedValue(undefined)
jest.mock('../lib/database', () => ({
  purgeAllLocalData: () => mockPurge(),
}))

const mockSignOut = jest.fn().mockResolvedValue(undefined)
jest.mock('./authService', () => ({
  signOut: () => mockSignOut(),
}))

import { exportMyData, eraseMyAccount } from './patientDataRightsService'

beforeEach(() => jest.clearAllMocks())

describe('patientDataRightsService.exportMyData', () => {
  it('appelle export_patient_data et renvoie les données brutes', async () => {
    mockRpc.mockResolvedValue({ data: { patient_id: 'me' }, error: null })
    const result = await exportMyData('me')
    expect(mockRpc).toHaveBeenCalledWith('export_patient_data', { p_patient_id: 'me' })
    expect(result).toEqual({ ok: true, data: { patient_id: 'me' } })
  })

  it('renvoie ok:false si le RPC échoue', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const result = await exportMyData('me')
    expect(result).toEqual({ ok: false, message: 'boom' })
  })
})

describe('patientDataRightsService.eraseMyAccount', () => {
  it('enchaîne RPC → Edge Function → purge locale → signOut', async () => {
    const order: string[] = []
    mockRpc.mockImplementation(() => { order.push('rpc'); return Promise.resolve({ data: { ok: true }, error: null }) })
    mockInvoke.mockImplementation(() => { order.push('invoke'); return Promise.resolve({ data: { ok: true }, error: null }) })
    mockPurge.mockImplementation(() => { order.push('purge'); return Promise.resolve() })
    mockSignOut.mockImplementation(() => { order.push('signout'); return Promise.resolve() })

    const result = await eraseMyAccount('me')

    expect(mockRpc).toHaveBeenCalledWith('erase_patient_data', { p_patient_id: 'me' })
    expect(mockInvoke).toHaveBeenCalledWith('delete-patient-account', { body: { patient_id: 'me' } })
    expect(order).toEqual(['rpc', 'invoke', 'purge', 'signout'])
    expect(result).toEqual({ ok: true })
  })

  it('arrête tout si le RPC échoue (ni Edge, ni purge, ni signOut)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'refusé' } })
    const result = await eraseMyAccount('me')
    expect(mockInvoke).not.toHaveBeenCalled()
    expect(mockPurge).not.toHaveBeenCalled()
    expect(mockSignOut).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: false, message: 'refusé' })
  })

  it('ne purge pas si l’Edge Function échoue', async () => {
    mockRpc.mockResolvedValue({ data: { ok: true }, error: null })
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'delete_failed' } })
    const result = await eraseMyAccount('me')
    expect(mockPurge).not.toHaveBeenCalled()
    expect(mockSignOut).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: false, message: 'delete_failed' })
  })
})
