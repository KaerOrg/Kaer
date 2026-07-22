import { vi, describe, it, expect } from 'vitest'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DefusionConfigPanel } from './DefusionConfigPanel'
import type { useDefusionConfigEditor } from '../hooks/useDefusionConfigEditor'

type Editor = ReturnType<typeof useDefusionConfigEditor>

function makeEditor(over: Partial<Editor> = {}): Editor {
  return {
    module: undefined,
    enabled: ['word_repetition', 'linguistic_distancing'],
    saving: false,
    openEditor: vi.fn(),
    toggle: vi.fn(),
    save: vi.fn().mockResolvedValue(true),
    ...over,
  } as Editor
}

describe('DefusionConfigPanel', () => {
  it('rend un toggle par technique', () => {
    render(<DefusionConfigPanel defusionConfig={makeEditor()} onClose={vi.fn()} />)
    expect(screen.getByLabelText('modules.cognitive_saturation.technique_word_repetition_name')).toBeTruthy()
    expect(screen.getByLabelText('modules.cognitive_saturation.technique_linguistic_distancing_name')).toBeTruthy()
  })

  it('verrouille le dernier toggle actif (garde ≥ 1)', () => {
    render(<DefusionConfigPanel defusionConfig={makeEditor({ enabled: ['word_repetition'] })} onClose={vi.fn()} />)
    const word = screen.getByLabelText('modules.cognitive_saturation.technique_word_repetition_name') as HTMLInputElement
    expect(word.disabled).toBe(true)
    // L'autre technique (désactivée) reste activable.
    const dist = screen.getByLabelText('modules.cognitive_saturation.technique_linguistic_distancing_name') as HTMLInputElement
    expect(dist.disabled).toBe(false)
  })

  it('bascule appelle toggle', () => {
    const editor = makeEditor()
    render(<DefusionConfigPanel defusionConfig={editor} onClose={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('modules.cognitive_saturation.technique_linguistic_distancing_name'))
    expect(editor.toggle).toHaveBeenCalledWith('linguistic_distancing')
  })

  it('Enregistrer persiste puis ferme', async () => {
    const onClose = vi.fn()
    const editor = makeEditor()
    render(<DefusionConfigPanel defusionConfig={editor} onClose={onClose} />)
    fireEvent.click(screen.getByText('common.save'))
    await waitFor(() => expect(editor.save).toHaveBeenCalled())
    expect(onClose).toHaveBeenCalled()
  })

  it('Annuler ferme sans enregistrer', () => {
    const onClose = vi.fn()
    const editor = makeEditor()
    render(<DefusionConfigPanel defusionConfig={editor} onClose={onClose} />)
    fireEvent.click(screen.getByText('common.cancel'))
    expect(onClose).toHaveBeenCalled()
    expect(editor.save).not.toHaveBeenCalled()
  })
})
