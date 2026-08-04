import { vi, describe, it, expect } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: { value?: string }) => (opts?.value != null ? `${key}:${opts.value}` : key) }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { ScalePassationBlock } from './ScalePassationBlock'

describe('ScalePassationBlock (K-6, hétéro)', () => {
  it('rend le bloc « en séance » + bouton Démarrer ; onStart au clic', () => {
    const onStart = vi.fn()
    render(<ScalePassationBlock onStart={onStart} lastPassationLabel={null} />)
    expect(screen.getByText('scales.passation.title')).toBeInTheDocument()
    expect(screen.getByText('scales.passation.desc')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /scales\.passation\.start/ }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('affiche « aucune » quand pas de dernière passation', () => {
    render(<ScalePassationBlock onStart={() => {}} lastPassationLabel={null} />)
    expect(screen.getByText(/scales\.passation\.last:scales\.passation\.last_none/)).toBeInTheDocument()
  })

  it('masque le bouton Aperçu quand onPreview absent', () => {
    render(<ScalePassationBlock onStart={() => {}} lastPassationLabel="12/07/2026" />)
    expect(screen.queryByText('scales.passation.preview')).not.toBeInTheDocument()
  })
})
