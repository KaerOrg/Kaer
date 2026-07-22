import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

let mockTechniques: string[] | undefined
vi.mock('@tanstack/react-query', async (orig) => ({
  ...(await orig<typeof import('@tanstack/react-query')>()),
  useQuery: () => ({ data: mockTechniques }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { DefusionPatientView } from './DefusionPatientView'

describe('DefusionPatientView', () => {
  beforeEach(() => { mockTechniques = undefined })

  it('rend les 11 écrans du parcours quand les deux techniques sont activées', () => {
    const { container } = render(<DefusionPatientView />)
    expect(container.querySelectorAll('.dpv-screen')).toHaveLength(11)
  })

  it('filtre le rail par étape (répétition de mot = 6 écrans)', () => {
    const { container } = render(<DefusionPatientView />)
    // 1re occurrence = la chip de filtre (rendue avant le rail).
    fireEvent.click(screen.getAllByText('modules.cognitive_saturation.technique_word_repetition_name')[0])
    expect(container.querySelectorAll('.dpv-screen')).toHaveLength(6)
  })

  it('reflète la configuration : une technique désactivée disparaît du rail et des filtres', () => {
    mockTechniques = ['linguistic_distancing']
    const { container } = render(<DefusionPatientView patientModuleId="pm1" />)
    // accueil (1) + distanciation (3) + historique (1) = 5, jamais les écrans de répétition.
    expect(container.querySelectorAll('.dpv-screen')).toHaveLength(5)
    // La technique désactivée disparaît des filtres (mais ses séances passées restent
    // visibles dans l'historique — d'où la vérification ciblée sur la barre de filtres).
    const filters = container.querySelector('.dpv-filters')
    expect(filters?.textContent).not.toContain('technique_word_repetition_name')
  })
})
