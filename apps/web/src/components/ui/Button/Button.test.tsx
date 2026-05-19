import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('affiche le label', () => {
    render(<Button>Envoyer</Button>)
    expect(screen.getByText('Envoyer')).toBeInTheDocument()
  })

  it('déclenche onClick au clic', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Clic</Button>)
    await userEvent.click(screen.getByText('Clic'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('est désactivé quand disabled=true', () => {
    render(<Button disabled>Clic</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('est désactivé et affiche le spinner quand loading=true', () => {
    render(<Button loading>Clic</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn.querySelector('.btn__spinner')).toBeTruthy()
  })

  it('applique la variante CSS', () => {
    render(<Button variant="danger">X</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn--danger')
  })

  it('applique la taille CSS', () => {
    render(<Button size="lg">X</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn--lg')
  })

  it('ne déclenche pas onClick quand disabled', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Clic</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
