import { isTestAccount, demoLocalId, TEST_ACCOUNT_EMAILS, DEMO_PREFIX } from './types'

describe('demo/types — isTestAccount', () => {
  it('accepte un email de la liste blanche', () => {
    expect(isTestAccount(TEST_ACCOUNT_EMAILS[0])).toBe(true)
  })

  it('est insensible à la casse et aux espaces', () => {
    expect(isTestAccount('  TEIL.Patient@Gmail.COM ')).toBe(true)
  })

  it('refuse un email hors liste', () => {
    expect(isTestAccount('vrai.patient@example.com')).toBe(false)
  })

  it('refuse null, undefined et chaîne vide', () => {
    expect(isTestAccount(null)).toBe(false)
    expect(isTestAccount(undefined)).toBe(false)
    expect(isTestAccount('')).toBe(false)
  })
})

describe('demo/types — DEMO_PREFIX', () => {
  it('vaut « demo- » (invariant de purge)', () => {
    expect(DEMO_PREFIX).toBe('demo-')
  })
})

describe('demo/types — demoLocalId', () => {
  it('impose le préfixe demo- devant le suffixe du module', () => {
    expect(demoLocalId('sleep-2026-07-01')).toBe('demo-sleep-2026-07-01')
  })

  it('produit toujours un id que le filtre de purge reconnaît', () => {
    expect(demoLocalId('x').startsWith(DEMO_PREFIX)).toBe(true)
  })
})
