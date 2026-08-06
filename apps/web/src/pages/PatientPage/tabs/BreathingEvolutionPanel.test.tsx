import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { BreathingSessionRow, BreathingTechniqueSpec } from '@kaer/shared'
import { BreathingEvolutionPanel } from './BreathingEvolutionPanel'

const TECHNIQUES: BreathingTechniqueSpec[] = [
  { key: 'coherence_cardiaque', color: 'rgb(74, 158, 163)', recommendedDurationMin: 5, phases: [], evidenceGrade: null, evidenceScopeCode: null },
  { key: 'carree', color: 'rgb(200, 100, 50)', recommendedDurationMin: 5, phases: [], evidenceGrade: null, evidenceScopeCode: null },
]

function session(
  startedAt: string,
  techniqueKey = 'coherence_cardiaque',
  feeling: BreathingSessionRow['feeling'] = null,
): BreathingSessionRow {
  return {
    startedAt, techniqueKey, feeling,
    durationSeconds: 300, plannedDurationSeconds: 300, cyclesCompleted: 30, completed: true,
  }
}

function renderPanel(over: Partial<Parameters<typeof BreathingEvolutionPanel>[0]> = {}) {
  return render(
    <BreathingEvolutionPanel
      sessions={[session('2026-03-04T08:00:00'), session('2026-03-12T19:00:00', 'carree', 'calmer')]}
      techniques={TECHNIQUES}
      weeklyGoal={4}
      locale="fr"
      todayIsoDate="2026-03-18"
      {...over}
    />,
  )
}

describe('BreathingEvolutionPanel : W2', () => {
  it('ouvre sur le dernier mois portant des sessions', () => {
    renderPanel()
    expect(screen.getByText('Mars 2026')).toBeTruthy()
  })

  it('colore chaque jour pratique avec la teinte de sa technique', () => {
    const { container } = renderPanel()
    const days = [...container.querySelectorAll('.month-grid__day')]
    expect(days[3].style.background).toBe('rgb(74, 158, 163)')
    expect(days[11].style.background).toBe('rgb(200, 100, 50)')
  })

  it('pose un point de ressenti sur les jours ou le patient a repondu', () => {
    const { container } = renderPanel()
    // Une seule des deux sessions porte un ressenti.
    expect(container.querySelectorAll('.month-grid__dot')).toHaveLength(1)
  })

  it('rapproche le compte du mois de celui du mois precedent, sans evolution', () => {
    renderPanel({
      sessions: [
        session('2026-02-10T08:00:00'), session('2026-02-11T08:00:00'), session('2026-02-12T08:00:00'),
        session('2026-03-04T08:00:00'),
      ],
    })
    expect(screen.getByTestId('breathing-month-count').textContent).toBe('1')
    expect(screen.getByText('3 le mois précédent')).toBeTruthy()
  })

  it('rapporte les sessions de la semaine a l objectif du patient', () => {
    // Semaine du lundi 16 mars 2026 : deux sessions dedans, une hors semaine.
    renderPanel({
      sessions: [session('2026-03-04T08:00:00'), session('2026-03-16T08:00:00'), session('2026-03-18T08:00:00')],
      weeklyGoal: 4,
    })
    expect(screen.getByTestId('breathing-week-count').textContent).toBe('2/4')
    expect(screen.getByText('Objectif fixé par le patient')).toBeTruthy()
  })

  it('affiche le compte nu quand le patient n a pas fixe d objectif', () => {
    renderPanel({ sessions: [session('2026-03-16T08:00:00')], weeklyGoal: null })
    expect(screen.getByText('Aucun objectif fixé')).toBeTruthy()
    expect(screen.getByTestId('breathing-week-count').textContent).toBe('1')
  })

  it('compte les ressentis renseignes sur le total du mois', () => {
    renderPanel()
    expect(screen.getByText('1 renseignés sur 2, facultatif')).toBeTruthy()
  })

  it('desactive le mois suivant une fois sur le mois courant', () => {
    renderPanel({ sessions: [session('2026-03-04T08:00:00')], todayIsoDate: '2026-03-18' })
    expect(screen.getByLabelText('Suivant').closest('button')).toBeDisabled()
  })

  it('navigue vers le mois precedent et borne a la premiere session', () => {
    renderPanel({
      sessions: [session('2026-02-10T08:00:00'), session('2026-03-04T08:00:00')],
    })
    fireEvent.click(screen.getByLabelText('Précédent'))
    expect(screen.getByText('Février 2026')).toBeTruthy()
    expect(screen.getByLabelText('Précédent').closest('button')).toBeDisabled()
    expect(screen.getByLabelText('Suivant').closest('button')).not.toBeDisabled()
  })

  it('ne liste en legende que les techniques pratiquees ce mois', () => {
    renderPanel({ sessions: [session('2026-03-04T08:00:00', 'coherence_cardiaque')] })
    expect(screen.getByText('Cohérence cardiaque')).toBeTruthy()
    expect(screen.queryByText('Respiration carrée')).toBeNull()
  })

  it('porte la mention MDR et aucune fleche ni pourcentage', () => {
    const { container } = renderPanel()
    expect(screen.getByText(/Aucune interprétation algorithmique/)).toBeTruthy()
    expect(container.textContent).not.toMatch(/[↑↓%]/)
  })

  it('n affiche aucune cle i18n brute', () => {
    const { container } = renderPanel()
    expect(container.textContent).not.toMatch(/evolution\.|modules\.breathing/)
  })
})
