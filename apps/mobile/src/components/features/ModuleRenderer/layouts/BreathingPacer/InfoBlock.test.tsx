import React from 'react'
import { render } from '@testing-library/react-native'
import { InfoBlock } from './InfoBlock'

const t = (key: string) => `[${key}]`

describe('InfoBlock', () => {
  it('résout le titre et le texte depuis leurs clés i18n', () => {
    const { getByText } = render(
      <InfoBlock block={{ id: 'a', labelCode: 'label.what', textCode: 'texte.what', section: 'body' }} t={t} />,
    )
    expect(getByText('[label.what]')).toBeTruthy()
    expect(getByText('[texte.what]')).toBeTruthy()
  })

  it('n’affiche pas de titre quand le bloc n’en porte pas', () => {
    const { queryByText, getByText } = render(
      <InfoBlock block={{ id: 'a', labelCode: null, textCode: 'texte.seul', section: 'sources' }} t={t} />,
    )
    expect(getByText('[texte.seul]')).toBeTruthy()
    expect(queryByText('[null]')).toBeNull()
  })

  it('expose un testID dérivé de l’identifiant du bloc', () => {
    const { getByTestId } = render(
      <InfoBlock block={{ id: 'bt.tech.x.info_what', labelCode: null, textCode: 'a', section: 'body' }} t={t} />,
    )
    expect(getByTestId('breathing-info-block-bt.tech.x.info_what')).toBeTruthy()
  })
})
