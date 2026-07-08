import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { BAActivitiesConfigPanel } from './BAActivitiesConfigPanel'

type BAList = React.ComponentProps<typeof BAActivitiesConfigPanel>['baList']

function makeBAList(over: Partial<BAList> = {}): BAList {
  return {
    module: undefined,
    open: true,
    activities: [],
    domains: [{ id: 'al.dom_body', textCode: 'modules.behavioral_activation.domain_body' }],
    saving: false,
    openEditor: vi.fn(),
    close: vi.fn(),
    addActivity: vi.fn(),
    removeActivity: vi.fn(),
    ...over,
  }
}

beforeEach(() => vi.clearAllMocks())

describe('BAActivitiesConfigPanel', () => {
  it('affiche le message vide sans activité', () => {
    render(<BAActivitiesConfigPanel baList={makeBAList()} onClose={vi.fn()} />)
    expect(screen.getByText('modules.behavioral_activation.config_empty')).toBeTruthy()
  })

  it('liste les activités et supprime par id', () => {
    const baList = makeBAList({
      activities: [{ id: 'a1', label: 'Marcher', domain_id: 'al.dom_body', value_text: 'Prendre soin de moi' }],
    })
    render(<BAActivitiesConfigPanel baList={baList} onClose={vi.fn()} />)
    expect(screen.getByText('Marcher')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('common.delete'))
    expect(baList.removeActivity).toHaveBeenCalledWith('a1')
  })

  it('« Terminé » ferme la modale', () => {
    const onClose = vi.fn()
    render(<BAActivitiesConfigPanel baList={makeBAList()} onClose={onClose} />)
    fireEvent.click(screen.getByText('common.done'))
    expect(onClose).toHaveBeenCalled()
  })
})
