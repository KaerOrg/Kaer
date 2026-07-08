import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RimConfigPanel } from './RimConfigPanel'

type Rim = React.ComponentProps<typeof RimConfigPanel>['rim']

function makeRim(over: Partial<Rim> = {}): Rim {
  return {
    rimModule: undefined,
    mode: 'unlock',
    alternative: '',
    original: '',
    saving: false,
    error: null,
    open: vi.fn(),
    cancel: vi.fn(),
    confirm: vi.fn().mockResolvedValue(true),
    setAlternative: vi.fn(),
    setOriginal: vi.fn(),
    ...over,
  }
}

beforeEach(() => vi.clearAllMocks())

describe('RimConfigPanel', () => {
  it('affiche le libellé de déverrouillage en mode unlock', () => {
    render(<RimConfigPanel rim={makeRim({ mode: 'unlock' })} onClose={vi.fn()} />)
    expect(screen.getByText('patient.rim_write_unlock')).toBeTruthy()
    expect(screen.getByText('patient.rim_btn_unlock')).toBeTruthy()
  })

  it('valide puis ferme la modale au succès', async () => {
    const rim = makeRim({ alternative: 'x', confirm: vi.fn().mockResolvedValue(true) })
    const onClose = vi.fn()
    render(<RimConfigPanel rim={rim} onClose={onClose} />)
    fireEvent.click(screen.getByText('patient.rim_btn_unlock'))
    await waitFor(() => expect(rim.confirm).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('ne ferme pas la modale si la validation échoue', async () => {
    const rim = makeRim({ confirm: vi.fn().mockResolvedValue(false) })
    const onClose = vi.fn()
    render(<RimConfigPanel rim={rim} onClose={onClose} />)
    fireEvent.click(screen.getByText('patient.rim_btn_unlock'))
    await waitFor(() => expect(rim.confirm).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('le bouton annuler ferme la modale', () => {
    const onClose = vi.fn()
    render(<RimConfigPanel rim={makeRim()} onClose={onClose} />)
    fireEvent.click(screen.getByText('common.cancel'))
    expect(onClose).toHaveBeenCalled()
  })
})
