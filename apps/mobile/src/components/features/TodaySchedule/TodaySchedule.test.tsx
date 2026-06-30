import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { TodaySchedule } from './TodaySchedule'
import type { TodayRoutine } from '@services/homeService'

jest.mock('../../../hooks/useTeen', () => ({
  useTeen: () => ({ isTeenMode: false, tt: () => '', tg: () => '', teenColor: () => undefined }),
}))

const noop = () => undefined

const mkRoutine = (overrides: Partial<TodayRoutine> = {}): TodayRoutine => ({
  id: 'r-1',
  patient_module_id: 'pm-1',
  time_of_day: '10:00',
  patient_time_override: null,
  effective_time: '10:00',
  module_type: 'phq9',
  mobile_icon: 'brain',
  preview_kind: 'questionnaire',
  ...overrides,
})

const defaultProps = {
  routines: [mkRoutine()],
  isTeenMode: false,
  teenColor: () => undefined,
  onPress: noop,
}

describe('TodaySchedule', () => {
  it('affiche le header et les routines', () => {
    const { getByText } = render(<TodaySchedule {...defaultProps} />)
    expect(getByText('Prévu aujourd\'hui')).toBeTruthy()
    expect(getByText('10:00')).toBeTruthy()
  })

  it('affiche le nom du module via la clé i18n', () => {
    const { getByText } = render(<TodaySchedule {...defaultProps} />)
    expect(getByText('PHQ-9')).toBeTruthy()
  })

  it("affiche l'heure effective (override si présente)", () => {
    const { getByText } = render(
      <TodaySchedule
        {...defaultProps}
        routines={[mkRoutine({ effective_time: '08:30', patient_time_override: '08:30' })]}
      />
    )
    expect(getByText('08:30')).toBeTruthy()
  })

  it("retourne null et n'affiche rien si la liste est vide", () => {
    const { toJSON } = render(
      <TodaySchedule {...defaultProps} routines={[]} />
    )
    expect(toJSON()).toBeNull()
  })

  it('appelle onPress avec la bonne routine au tap', () => {
    const onPress = jest.fn()
    const routine = mkRoutine({ id: 'r-42' })
    const { getByText } = render(
      <TodaySchedule {...defaultProps} routines={[routine]} onPress={onPress} />
    )
    fireEvent.press(getByText('10:00'))
    expect(onPress).toHaveBeenCalledWith(routine)
  })

  it("affiche plusieurs routines dans l'ordre donné", () => {
    const { getAllByText } = render(
      <TodaySchedule
        {...defaultProps}
        routines={[
          mkRoutine({ id: 'r-a', effective_time: '08:00' }),
          mkRoutine({ id: 'r-b', effective_time: '14:00' }),
        ]}
      />
    )
    const times = getAllByText(/^\d{2}:\d{2}$/)
    expect(times[0].props.children).toBe('08:00')
    expect(times[1].props.children).toBe('14:00')
  })
})
