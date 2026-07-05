import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModuleConfigButton } from './ModuleConfigButton'

describe('ModuleConfigButton', () => {
  it('rend un bouton icône (roue crantée) dont le nom accessible est le libellé fourni', () => {
    render(<ModuleConfigButton label="Configurer le plan" onClick={vi.fn()} />)
    const btn = screen.getByRole('button', { name: 'Configurer le plan' })
    expect(btn).toBeTruthy()
    // icône seule : le libellé n’est pas rendu en texte visible
    expect(btn.textContent).toBe('')
  })

  it('déclenche onClick au clic', () => {
    const onClick = vi.fn()
    render(<ModuleConfigButton label="Configurer les effets" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Configurer les effets' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
