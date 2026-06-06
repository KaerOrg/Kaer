import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip } from '../../ui/Chip'

export interface CareTagProps {
  tag: string
  onRemove: (tag: string) => void
}

/** Une étiquette « Soins en cours » supprimable. Mémoïsée : callback figé via useCallback. */
function CareTagComponent({ tag, onRemove }: CareTagProps) {
  const { t } = useTranslation()
  const handleRemove = useCallback(() => onRemove(tag), [tag, onRemove])

  return <Chip label={tag} onRemove={handleRemove} removeLabel={t('file_active.care.remove', { tag })} />
}

export const CareTag = memo(CareTagComponent)
