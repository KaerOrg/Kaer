import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import type { MedicationKind } from '@psytool/shared'
import type { MedicationDraft } from '../hooks/useMedicationListEditor'
import { MED_ADD_WRAP, MED_ADD_INPUT, MED_ADD_KINDS, medKindBtnStyle } from './medicationListStyles'

interface Props {
  onAdd: (draft: MedicationDraft) => void
}

// Formulaire d'ajout d'une molécule. `name` contrôlé (conditionne l'ajout),
// `posology` non contrôlé (lu au submit), `kind` en état (style sélectionné).
export function MedicationAddForm({ onAdd }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<MedicationKind>('maintenance')
  const posologyRef = useRef<HTMLInputElement>(null)

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
    <div style={MED_ADD_WRAP}>
      <input
        style={MED_ADD_INPUT}
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={t('modules.medication_adherence.med_name')}
        onKeyDown={onKeyDown}
      />
      <input
        ref={posologyRef}
        style={MED_ADD_INPUT}
        placeholder={t('modules.medication_adherence.med_posology')}
        onKeyDown={onKeyDown}
      />
      <div style={MED_ADD_KINDS}>
        <button type="button" style={medKindBtnStyle(kind === 'maintenance')} onClick={() => setKind('maintenance')}>
          {t('modules.medication_adherence.kind_maintenance')}
        </button>
        <button type="button" style={medKindBtnStyle(kind === 'prn')} onClick={() => setKind('prn')}>
          {t('modules.medication_adherence.kind_prn')}
        </button>
      </div>
      <Button size="sm" variant="ghost" onClick={submit}>
        {t('modules.medication_adherence.meds_add')}
      </Button>
    </div>
  )
}
