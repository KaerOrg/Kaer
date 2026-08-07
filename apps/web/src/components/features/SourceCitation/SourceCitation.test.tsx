import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SourceCitation } from './SourceCitation'

const CITATION = 'PHQ-9, Kroenke, Spitzer & Williams, 2001'

describe('SourceCitation', () => {
  it('rend la citation des auteurs', () => {
    render(<SourceCitation citation={CITATION} />)
    expect(screen.getByText(CITATION)).toBeInTheDocument()
  })

  it('rend l\'attribution de traduction quand il y a un tiers à attribuer', () => {
    render(<SourceCitation citation={CITATION} translationAttribution="Traduction MAPI, sous licence" />)
    expect(screen.getByText('Traduction MAPI, sous licence')).toBeInTheDocument()
  })

  // ── Le cas nul est le cas NOMINAL, pas un cas dégradé ──────────────────────

  it('ne rend aucune ligne d\'attribution quand il n\'y a aucun tiers', () => {
    const { container } = render(<SourceCitation citation={CITATION} />)
    const block = screen.getByTestId('source-citation')
    // Un seul enfant : la citation. Pas de ligne vide, pas de séparateur orphelin.
    expect(block.children).toHaveLength(1)
    expect(container.querySelector('.source-citation__translation')).toBeNull()
  })

  it('traite explicitement `null` comme « aucun tiers »', () => {
    render(<SourceCitation citation={CITATION} translationAttribution={null} />)
    expect(screen.getByTestId('source-citation').children).toHaveLength(1)
  })

  it('ne rend rien du tout quand la citation est absente', () => {
    // Mieux vaut aucun bloc qu'un cadre vide : l'absence de citation est un défaut de
    // configuration, pas un état à mettre en page.
    const { container } = render(<SourceCitation citation="" />)
    expect(container.firstChild).toBeNull()
  })

  it('ne rend rien quand la citation n\'est que des espaces', () => {
    const { container } = render(<SourceCitation citation="   " />)
    expect(container.firstChild).toBeNull()
  })
})
