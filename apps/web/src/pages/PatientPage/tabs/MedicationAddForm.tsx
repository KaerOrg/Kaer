import { useState, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import { SegmentedControl } from '../../../components/ui/SegmentedControl'
import type { SegmentOption } from '../../../components/ui/SegmentedControl/SegmentedControl.types'
import type { MedicationKind } from '@psytool/shared'
import type { MedicationDraft } from '../hooks/useMedicationListEditor'

interface Props {
  onAdd: (draft: MedicationDraft) => void
}

// Formulaire d'ajout d'une molécule. `name` contrôlé (conditionne l'ajout),
// `posology` non contrôlé (lu au submit), `kind` en état (segment sélectionné).
export function MedicationAddForm({ onAdd }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<MedicationKind>('maintenance')
  const posologyRef = useRef<HTMLInputElement>(null)

  const kindOptions = useMemo<SegmentOption<MedicationKind>[]>(() => [
    { value: 'maintenance', label: t('modules.medication_adherence.kind_maintenance') },
    { value: 'prn', label: t('modules.medication_adherence.kind_prn') },
  ], [t])

  const submit = useCallback(() => {
    if (name.trim().length === 0) return
    onAdd({ name, posology: posologyRef.current?.value ?? '', kind })
    setName('')
    if (posologyRef.current) posologyRef.current.value = ''
    setKind('maintenance')
  }, [name, kind, onAdd])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit()
  }, [submit])

  return (
    <div className="med-add">
      <input
        className="med-add__input"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={t('modules.medication_adherence.med_name')}
        onKeyDown={onKeyDown}
      />
      <input
        ref={posologyRef}
        className="med-add__input"
        placeholder={t('modules.medication_adherence.med_posology')}
        onKeyDown={onKeyDown}
      />
      <SegmentedControl
        options={kindOptions}
        value={kind}
        onChange={setKind}
        variant="pills"
      />
      <Button size="sm" variant="ghost" onClick={submit}>
        {t('modules.medication_adherence.meds_add')}
      </Button>
    </div>
  )
}
