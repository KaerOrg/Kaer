import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}))

import { supabase } from '../lib/supabase'
import { submitThemeSuggestion } from './themeSuggestionService'

beforeEach(() => vi.clearAllMocks())

describe('themeSuggestionService.submitThemeSuggestion', () => {
  it('invoque l’Edge Function avec la suggestion et renvoie ok', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { success: true }, error: null } as never)

    const result = await submitThemeSuggestion('Gérer les attaques de panique')

    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-theme-suggestion', {
      body: { suggestion: 'Gérer les attaques de panique' },
    })
    expect(result).toEqual({ ok: true })
  })

  it('renvoie ok:false en cas d’erreur', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: null, error: { message: 'boom' } } as never)

    const result = await submitThemeSuggestion('x')

    expect(result).toEqual({ ok: false })
  })
})
