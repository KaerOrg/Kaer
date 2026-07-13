jest.mock('../../../../../hooks/useModuleT', () => ({
  useModuleTranslation: () => (k: string) => k,
}))
jest.mock('@ui/TimePicker', () => ({
  TimePicker: (props: { testID?: string }) => {
    const { View } = require('react-native')
    return <View testID={props.testID} />
  },
}))

import { render, screen } from '@testing-library/react-native'
import { ColumnTimeField } from './ColumnTimeField'

function renderField(fieldKey: string) {
  render(
    <ColumnTimeField
      fieldKey={fieldKey}
      label="Lever"
      value=""
      optional
      accent="#3B82F6"
      onChange={jest.fn()}
    />,
  )
}

describe('ColumnTimeField', () => {
  it('précède le champ d’une tuile d’icône pour un repère chronobiologique', () => {
    renderField('wake_time')
    expect(screen.getByTestId('time-tile-wake_time')).toBeTruthy()
    expect(screen.getByTestId('time-wake_time')).toBeTruthy()
  })

  it('n’ajoute pas de tuile pour une clé hors repère', () => {
    renderField('some_other_key')
    expect(screen.queryByTestId('time-tile-some_other_key')).toBeNull()
    expect(screen.getByTestId('time-some_other_key')).toBeTruthy()
  })
})
