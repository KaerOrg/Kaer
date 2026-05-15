import { render, screen } from '@testing-library/react'
import { StepBreadcrumb } from './StepBreadcrumb'

const STEPS = ['Informations', 'Modules', 'Confirmation']

// ── Rendu des étapes ──────────────────────────────────────────────────────────

describe('StepBreadcrumb — rendu des étapes', () => {
  it('affiche tous les labels d\'étapes', () => {
    render(<StepBreadcrumb steps={STEPS} currentStep={1} />)
    expect(screen.getByText('Informations')).toBeInTheDocument()
    expect(screen.getByText('Modules')).toBeInTheDocument()
    expect(screen.getByText('Confirmation')).toBeInTheDocument()
  })

  it('affiche les flèches entre les étapes', () => {
    const { container } = render(<StepBreadcrumb steps={STEPS} currentStep={1} />)
    const arrows = container.querySelectorAll('.step-breadcrumb__arrow')
    expect(arrows).toHaveLength(STEPS.length - 1)
  })
})

// ── État actif ────────────────────────────────────────────────────────────────

describe('StepBreadcrumb — étape active', () => {
  it('étape 1 active : a la classe --active', () => {
    const { container } = render(<StepBreadcrumb steps={STEPS} currentStep={1} />)
    const steps = container.querySelectorAll('.step-breadcrumb__step')
    expect(steps[0]).toHaveClass('step-breadcrumb__step--active')
  })

  it('étape 2 active : étape 1 est done, étape 2 est active', () => {
    const { container } = render(<StepBreadcrumb steps={STEPS} currentStep={2} />)
    const steps = container.querySelectorAll('.step-breadcrumb__step')
    expect(steps[0]).toHaveClass('step-breadcrumb__step--done')
    expect(steps[1]).toHaveClass('step-breadcrumb__step--active')
  })

  it('étape 3 active : étapes 1 et 2 sont done', () => {
    const { container } = render(<StepBreadcrumb steps={STEPS} currentStep={3} />)
    const steps = container.querySelectorAll('.step-breadcrumb__step')
    expect(steps[0]).toHaveClass('step-breadcrumb__step--done')
    expect(steps[1]).toHaveClass('step-breadcrumb__step--done')
    expect(steps[2]).toHaveClass('step-breadcrumb__step--active')
  })

  it("étapes futures n'ont ni --active ni --done", () => {
    const { container } = render(<StepBreadcrumb steps={STEPS} currentStep={1} />)
    const steps = container.querySelectorAll('.step-breadcrumb__step')
    expect(steps[1]).not.toHaveClass('step-breadcrumb__step--active')
    expect(steps[1]).not.toHaveClass('step-breadcrumb__step--done')
  })
})

// ── Numéros et symboles ───────────────────────────────────────────────────────

describe('StepBreadcrumb — numéros d\'étapes', () => {
  it('affiche les numéros pour les étapes non terminées', () => {
    render(<StepBreadcrumb steps={STEPS} currentStep={1} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('remplace le numéro par ✓ pour les étapes terminées', () => {
    render(<StepBreadcrumb steps={STEPS} currentStep={3} />)
    const checks = screen.getAllByText('✓')
    expect(checks).toHaveLength(2)
  })
})

// ── Cas avec 2 étapes (cas Dashboard) ────────────────────────────────────────

describe('StepBreadcrumb — 2 étapes', () => {
  it('fonctionne avec 2 étapes à l\'étape 1', () => {
    render(<StepBreadcrumb steps={['Info', 'Modules']} currentStep={1} />)
    expect(screen.getByText('Info')).toBeInTheDocument()
    expect(screen.getByText('Modules')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('fonctionne avec 2 étapes à l\'étape 2', () => {
    const { container } = render(<StepBreadcrumb steps={['Info', 'Modules']} currentStep={2} />)
    const steps = container.querySelectorAll('.step-breadcrumb__step')
    expect(steps[0]).toHaveClass('step-breadcrumb__step--done')
    expect(steps[1]).toHaveClass('step-breadcrumb__step--active')
  })
})
