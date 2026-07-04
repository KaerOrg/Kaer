import { describe, it, expect, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { ModuleNotifButton } from './ModuleNotifButton'

describe('ModuleNotifButton', () => {
  it('rend un bouton icône dont le nom accessible est le libellé « Configurer les rappels »', () => {
    render(<ModuleNotifButton onClick={vi.fn()} />)
    const btn = screen.getByRole('button', { name: 'notifications.configure_button' })
    expect(btn).toBeTruthy()
    expect(btn.textContent).toBe('')
  })

  it('déclenche onClick au clic', () => {
    const onClick = vi.fn()
    render(<ModuleNotifButton onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'notifications.configure_button' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
