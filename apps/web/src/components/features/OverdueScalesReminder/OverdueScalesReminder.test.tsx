import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key} ${Object.values(opts).join(' ')}` : key,
  }),
}))

import { OverdueScalesReminder, type OverdueScaleItem } from './OverdueScalesReminder'
import type { ModuleType } from '../../../lib/database.types'

const ITEMS: OverdueScaleItem[] = [
  { moduleType: 'nsi' as ModuleType, label: 'NSI', overdueDays: 20 },
  { moduleType: 'gad7' as ModuleType, label: 'GAD-7', overdueDays: 5 },
]

describe('OverdueScalesReminder', () => {
  it('ne rend rien quand aucune échelle en retard', () => {
    const { container } = render(<OverdueScalesReminder items={[]} onOpen={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('liste les échelles en retard et remonte l\'échelle cliquée', () => {
    const onOpen = vi.fn()
    render(<OverdueScalesReminder items={ITEMS} onOpen={onOpen} />)
    // titre avec le nombre d'échelles en retard
    expect(screen.getByText(/scales.programmed.banner_title 2/)).toBeInTheDocument()
    // un bouton par échelle, avec son nom et son retard
    fireEvent.click(screen.getByRole('button', { name: /NSI 20/ }))
    expect(onOpen).toHaveBeenCalledWith('nsi')
    fireEvent.click(screen.getByRole('button', { name: /GAD-7 5/ }))
    expect(onOpen).toHaveBeenCalledWith('gad7')
  })
})
