import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockShowActionSheet = jest.fn()
jest.mock('../../../contexts/ActionSheetContext', () => ({
  useActionSheet: () => ({ showActionSheet: mockShowActionSheet }),
}))

import { AvatarEditor } from './AvatarEditor'

beforeEach(() => jest.clearAllMocks())

describe('AvatarEditor', () => {
  it('affiche le placeholder d’initiales quand aucune photo', () => {
    const { getByText } = render(<AvatarEditor uri={null} uploading={false} onPickSource={jest.fn()} />)
    expect(getByText('profile.avatar_placeholder')).toBeTruthy()
  })

  it('ouvre la feuille galerie / appareil photo au tap', () => {
    const onPickSource = jest.fn()
    const { getByLabelText } = render(
      <AvatarEditor uri={null} uploading={false} onPickSource={onPickSource} />,
    )
    fireEvent.press(getByLabelText('profile.avatar_edit_label'))
    expect(mockShowActionSheet).toHaveBeenCalledTimes(1)

    const arg = mockShowActionSheet.mock.calls[0][0]
    arg.options[0].onPress()
    expect(onPickSource).toHaveBeenCalledWith('library')
    arg.options[1].onPress()
    expect(onPickSource).toHaveBeenCalledWith('camera')
  })
})
