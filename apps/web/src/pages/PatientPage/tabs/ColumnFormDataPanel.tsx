import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import type { ModuleType } from '../../../lib/database.types'
import type { FormEntryRow } from '@services/engagementService'
import { moduleQueries } from '../../../hooks/queries'
import { buildColumnSpecs } from './columnFormData'
import { ColumnFormEntryList } from './ColumnFormEntryList'
import { ColumnFormRecordDetail } from './ColumnFormRecordDetail'
import './ColumnFormDataPanel.css'

interface Props {
  moduleType: ModuleType
  entries: FormEntryRow[]
}

/**
 * Panneau « Données » des modules `column_form` (colonnes de Beck) : vue
 * praticien maître-détail sur écran large : liste latérale des saisies +
 * détail de la fiche sélectionnée (mouvement de restructuration avant→après,
 * texte intégral du patient structuré par colonne). Structure, libellés et
 * couleurs dérivés de `module_content_fields` (config-first). Conforme MDR
 * 2017/745 : valeurs brutes, aucun seuil, label interprétatif ni couleur de
 * jugement.
 */
export function ColumnFormDataPanel({ moduleType, entries }: Props) {
  const { t, i18n } = useTranslation()
  const fieldsQuery = useQuery(moduleQueries.fields(moduleType))
  const fields = useMemo(() => fieldsQuery.data?.fields ?? [], [fieldsQuery.data])
  const columns = useMemo(() => buildColumnSpecs(fields), [fields])

  // Fiches : la plus récente d'abord (le service renvoie l'ordre chronologique).
  const records = useMemo(() => entries.slice().reverse(), [entries])
  const [selectedIndex, setSelectedIndex] = useState(0)
  // Antichronologique : « plus ancienne » = index suivant, « plus récente » = précédent.
  const onOlder = useCallback(() => setSelectedIndex(i => Math.min(i + 1, records.length - 1)), [records.length])
  const onNewer = useCallback(() => setSelectedIndex(i => Math.max(i - 1, 0)), [])

  if (fieldsQuery.isLoading) {
    return (
      <div className="module-data-panel">
        <p className="module-data-panel__message">{t('common.loading')}</p>
      </div>
    )
  }

  const index = Math.min(selectedIndex, records.length - 1)
  const selected = records[index]
  const olderDate = index < records.length - 1 ? records[index + 1].date : null
  const newerDate = index > 0 ? records[index - 1].date : null

  return (
    <div className="module-data-panel cfd-panel">
      <div className="cfd-layout">
        <ColumnFormEntryList
          entries={records}
          selectedIndex={index}
          locale={i18n.language}
          title={t('patient.form_records_title')}
          onSelect={setSelectedIndex}
        />
        {selected && (
          <ColumnFormRecordDetail
            entry={selected}
            columns={columns}
            locale={i18n.language}
            t={t}
            onOlder={onOlder}
            onNewer={onNewer}
            olderDate={olderDate}
            newerDate={newerDate}
          />
        )}
      </div>
    </div>
  )
}
