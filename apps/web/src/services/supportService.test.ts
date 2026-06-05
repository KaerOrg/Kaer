import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}))

import { supabase } from '../lib/supabase'
import { submitSupportRequest, SUPPORT_REASONS } from './supportService'

beforeEach(() => vi.clearAllMocks())

describe('supportService.submitSupportRequest', () => {
  it("invoque l'Edge Function send-support-request avec le motif", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { success: true }, error: null } as never)

    const result = await submitSupportRequest('mfa_lost')

    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-support-request', {
      body: { reason: 'mfa_lost' },
    })
    expect(result).toEqual({ ok: true })
  })

  it('renvoie ok:false si l’Edge Function échoue', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    } as never)

    const result = await submitSupportRequest('other')

    expect(result).toEqual({ ok: false })
  })

  it('expose une liste fermée de motifs (formulaire borné)', () => {
    expect(SUPPORT_REASONS).toEqual(['mfa_lost', 'login_issue', 'account_issue', 'other'])
  })
})
