import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Accordion } from './Accordion'

describe('Accordion', () => {
  it('affiche le titre', () => {
    render(<Accordion title="Section"><p>corps</p></Accordion>)
    expect(screen.getByText('Section')).toBeInTheDocument()
  })

  it('est fermé par défaut', () => {
    render(<Accordion title="S"><p>corps</p></Accordion>)
    expect(screen.queryByText('corps')).toBeNull()
  })

  it("s'ouvre au clic", async () => {
    render(<Accordion title="S"><p>corps</p></Accordion>)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText('corps')).toBeInTheDocument()
  })

  it('se referme au second clic', async () => {
    render(<Accordion title="S"><p>corps</p></Accordion>)
    await userEvent.click(screen.getByRole('button'))
    await userEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('corps')).toBeNull()
  })

  it("s'ouvre par défaut si defaultOpen=true", () => {
    render(<Accordion title="S" defaultOpen><p>corps</p></Accordion>)
    expect(screen.getByText('corps')).toBeInTheDocument()
  })

  it('affiche le badge si fourni', () => {
    render(<Accordion title="S" badge={3}><p>c</p></Accordion>)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('affiche le sous-titre si fourni', () => {
    render(<Accordion title="S" subtitle="Détail"><p>c</p></Accordion>)
    expect(screen.getByText('Détail')).toBeInTheDocument()
  })
})
