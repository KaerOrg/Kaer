import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { SourceCitation } from './SourceCitation'

const CITATION = 'PHQ-9, Kroenke, Spitzer & Williams, 2001'

describe('SourceCitation', () => {
  it('rend la citation des auteurs', () => {
    render(<SourceCitation citation={CITATION} />)
    expect(screen.getByText(CITATION)).toBeTruthy()
  })

  it('rend l\'attribution de traduction quand il y a un tiers à attribuer', () => {
    render(<SourceCitation citation={CITATION} translationAttribution="Traduction MAPI, sous licence" />)
    expect(screen.getByText('Traduction MAPI, sous licence')).toBeTruthy()
  })

  // ── Le cas nul est le cas NOMINAL, pas un cas dégradé ──────────────────────

  it('ne rend aucune ligne d\'attribution quand il n\'y a aucun tiers', () => {
    render(<SourceCitation citation={CITATION} />)
    // Un seul enfant : la citation. Pas de ligne vide, pas de séparateur orphelin.
    expect(screen.getByTestId('source-citation').children).toHaveLength(1)
  })

  it('traite explicitement `null` comme « aucun tiers »', () => {
    render(<SourceCitation citation={CITATION} translationAttribution={null} />)
    expect(screen.getByTestId('source-citation').children).toHaveLength(1)
  })

  it('ne rend rien du tout quand la citation est absente ou vide', () => {
    render(<SourceCitation citation="" />)
    expect(screen.queryByTestId('source-citation')).toBeNull()
    render(<SourceCitation citation="   " />)
    expect(screen.queryByTestId('source-citation')).toBeNull()
  })
})
