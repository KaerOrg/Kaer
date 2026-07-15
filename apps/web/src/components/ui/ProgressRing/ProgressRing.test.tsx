import { render, screen } from '@testing-library/react'
import { ProgressRing } from './ProgressRing'

describe('ProgressRing', () => {
  it('affiche le label et le sous-label au centre', () => {
    render(<ProgressRing value={91} label="91 %" sublabel="efficacité" />)
    expect(screen.getByText('91 %')).toBeInTheDocument()
    expect(screen.getByText('efficacité')).toBeInTheDocument()
  })

  it('rend la jauge seule sans label', () => {
    const { container } = render(<ProgressRing value={50} />)
    expect(container.querySelector('.progress-ring__center')).toBeNull()
    expect(container.querySelectorAll('circle')).toHaveLength(2)
  })

  it('expose un libellé accessible', () => {
    render(<ProgressRing value={80} ariaLabel="Efficacité du sommeil" />)
    expect(screen.getByLabelText('Efficacité du sommeil')).toBeInTheDocument()
  })

  it('borne le remplissage (dashoffset) entre 0 et la circonférence', () => {
    const { container } = render(<ProgressRing value={200} max={100} size={96} strokeWidth={10} />)
    const arc = container.querySelectorAll('circle')[1]
    // value > max → fraction 1 → dashoffset 0
    expect(arc.getAttribute('stroke-dashoffset')).toBe('0')
  })

  it('à 0 %, le dashoffset vaut la circonférence complète (arc vide)', () => {
    const { container } = render(<ProgressRing value={0} max={100} size={96} strokeWidth={10} />)
    const arc = container.querySelectorAll('circle')[1]
    const dasharray = arc.getAttribute('stroke-dasharray')
    expect(arc.getAttribute('stroke-dashoffset')).toBe(dasharray)
  })
})
