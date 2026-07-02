import { useState, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { Dropdown, type DropdownOption } from '@ui/Dropdown'
import type { BAActivityDraft, BADomainOption } from '../hooks/useBAActivitiesEditor'

interface Props {
  domains: BADomainOption[]
  onAdd: (draft: BAActivityDraft) => void
}

// Formulaire d'ajout d'une activité co-construite. `label` contrôlé (conditionne
// l'ajout), `valueText` non contrôlé (lu au submit), `domainId` en état (Dropdown).
export function BAActivityAddForm({ domains, onAdd }: Props) {
  const { t } = useTranslation()
  const [label, setLabel] = useState('')
  const [domainId, setDomainId] = useState('')
  const valueTextRef = useRef<HTMLInputElement>(null)

  const domainOptions = useMemo<DropdownOption[]>(
    () => domains.map(d => ({ value: d.id, label: t(d.textCode) })),
    [domains, t],
  )

  const submit = useCallback(() => {
    if (label.trim().length === 0 || domainId.length === 0) return
    onAdd({ label, domainId, valueText: valueTextRef.current?.value ?? '' })
    setLabel('')
    setDomainId('')
    if (valueTextRef.current) valueTextRef.current.value = ''
  }, [label, domainId, onAdd])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit()
  }, [submit])

  return (
    <div className="med-add ba-add">
      <input
        className="med-add__input"
        value={label}
        maxLength={80}
        onChange={e => setLabel(e.target.value)}
        placeholder={t('modules.behavioral_activation.config_activity_placeholder')}
        onKeyDown={onKeyDown}
      />
      <Dropdown
        options={domainOptions}
        value={domainId}
        onChange={setDomainId}
        ariaLabel={t('modules.behavioral_activation.config_domain_label')}
        placeholder={t('modules.behavioral_activation.config_domain_label')}
        searchable={false}
        compact
      />
      <input
        ref={valueTextRef}
        className="med-add__input"
        maxLength={200}
        placeholder={t('modules.behavioral_activation.config_value_placeholder')}
        onKeyDown={onKeyDown}
      />
      <Button size="sm" variant="ghost" onClick={submit} disabled={label.trim().length === 0 || domainId.length === 0}>
        {t('modules.behavioral_activation.config_add')}
      </Button>
    </div>
  )
}
