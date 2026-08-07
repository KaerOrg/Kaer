import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { DormantModule } from '@services/moduleCatalogService'
import { DormantScalesCard } from './DormantScalesCard'

function renderCard(items: DormantModule[]) {
  return render(<DormantScalesCard items={items} />)
}

describe('DormantScalesCard', () => {
  it('ne rend rien quand aucune échelle n\'est en veille', () => {
    const { container } = renderCard([])
    expect(container.firstChild).toBeNull()
  })

  it('liste les échelles en veille avec leur motif', () => {
    const { container } = renderCard([
      { id: 'bsl23', reason: 'rights' },
      { id: 'gad7', reason: 'beta_scope' },
    ])

    expect(container.textContent).toContain('modules.bsl23.label')
    expect(container.textContent).toContain('modules.gad7.label')
    expect(container.textContent).toContain('scales.dormant.reason_rights')
    expect(container.textContent).toContain('scales.dormant.reason_beta_scope')
  })

  it('ne mélange JAMAIS les deux motifs', () => {
    // Annoncer une question de licence devant le GAD-7, qui est libre, serait faux.
    // C'est l'erreur exacte que la maquette W3 contenait et que le ticket corrige.
    const { container } = renderCard([
      { id: 'bsl23', reason: 'rights' },
      { id: 'nsi', reason: 'rights' },
      { id: 'gad7', reason: 'beta_scope' },
      { id: 'asrs6', reason: 'beta_scope' },
    ])

    const groups = container.querySelectorAll('.dormant-scales__group')
    expect(groups).toHaveLength(2)

    const rights = groups[0].textContent ?? ''
    expect(rights).toContain('modules.bsl23.label')
    expect(rights).toContain('modules.nsi.label')
    expect(rights).not.toContain('modules.gad7.label')
    expect(rights).not.toContain('modules.asrs6.label')

    const beta = groups[1].textContent ?? ''
    expect(beta).toContain('modules.gad7.label')
    expect(beta).toContain('modules.asrs6.label')
    expect(beta).not.toContain('modules.bsl23.label')
  })

  it('n\'affiche pas un groupe vide de motif', () => {
    const { container } = renderCard([{ id: 'gad7', reason: 'beta_scope' }])

    expect(container.querySelectorAll('.dormant-scales__group')).toHaveLength(1)
    expect(container.textContent).not.toContain('scales.dormant.reason_rights')
  })

  it('ne propose AUCUNE action : la zone informe, elle n\'assigne rien', () => {
    // Le ticket est explicite : « aucune échelle en veille n'est assignable ». Un
    // contrôle ici serait la porte d'entrée exacte que #247 et #406 ferment.
    const { container } = renderCard([
      { id: 'bsl23', reason: 'rights' },
      { id: 'gad7', reason: 'beta_scope' },
    ])

    expect(container.querySelectorAll('button')).toHaveLength(0)
    expect(container.querySelectorAll('input')).toHaveLength(0)
    expect(container.querySelectorAll('a')).toHaveLength(0)
  })
})
