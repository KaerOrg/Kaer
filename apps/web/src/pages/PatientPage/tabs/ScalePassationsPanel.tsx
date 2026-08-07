import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { todayIso } from '@kaer/shared'
import type { ModuleType } from '../../../lib/database.types'
import {
  engagementQueries, moduleQueries, scaleQueries, scaleScheduleQueries, useMarkPassationRead,
} from '../../../hooks/queries'
import { computeScheduleStatus } from '../../../lib/scaleScheduleStatus'
import { ScalePassationDetail, ScalePassationList } from '../../../components/features/ScalePassationDetail'
import './ScalePassationsPanel.css'

interface Props {
  patientId: string
  moduleType: ModuleType
}

/**
 * Panneau « Données » d'une échelle : liste des passations + détail de celle qui est
 * sélectionnée (#418, QW-1). Maître-détail, comme les fiches `column_form`.
 *
 * L'orchestration des lectures vit ici, le rendu dans `ScalePassationDetail` qui reste
 * présentationnel. Toutes les lectures passent par une factory `hooks/queries` : les
 * libellés du questionnaire et les métadonnées d'échelle sont des données de config,
 * déjà en cache pour toute l'app, et ne coûtent donc rien de plus ici.
 */
export function ScalePassationsPanel({ patientId, moduleType }: Props) {
  const { t, i18n } = useTranslation()
  const passationsQuery = useQuery(engagementQueries.scalePassations(patientId, moduleType))
  const fieldsQuery = useQuery(moduleQueries.fields(moduleType))
  const scheduleQuery = useQuery(scaleScheduleQueries.byScale(patientId, moduleType))
  const metaQuery = useQuery(scaleQueries.meta())

  // La plus récente en tête : c'est celle qu'on vient consulter.
  const records = useMemo(
    () => (passationsQuery.data ?? []).slice().reverse(),
    [passationsQuery.data],
  )
  const [selectedIndex, setSelectedIndex] = useState(0)

  const evaluationType = useMemo(
    () => metaQuery.data?.find(m => m.id === moduleType)?.evaluationType ?? 'auto',
    [metaQuery.data, moduleType],
  )
  // Ancre « aujourd'hui » stable sur la durée du rendu (même règle que la colonne
  // « Programmée », K-7).
  const today = useMemo(() => todayIso(), [])

  /**
   * Prochaine échéance de calendrier, ou `null` si l'échelle est à la demande.
   *
   * Seule `nextDate` est reprise. `overdueDays` reste dehors : le retard est un
   * constat administratif utile dans un tableau de suivi, il n'a rien à faire dans la
   * lecture d'une passation, où il se lirait comme un commentaire sur le patient.
   */
  const nextDueIso = useMemo(() => {
    const status = computeScheduleStatus({
      schedule: scheduleQuery.data ?? null,
      evaluationType,
      lastActivityIso: records[0]?.date.slice(0, 10) ?? null,
      todayIso: today,
    })
    return status.kind === 'home' ? status.nextDate : null
  }, [scheduleQuery.data, evaluationType, records, today])

  const handleSelect = useCallback((index: number) => setSelectedIndex(index), [])

  // Une passation supprimée peut rendre l'index caduc : on borne au lieu de rendre vide.
  const index = Math.min(selectedIndex, records.length - 1)
  const selected = index >= 0 ? records[index] : null
  // « Précédente » = la suivante dans l'ordre antichronologique.
  const previous = index >= 0 && index < records.length - 1 ? records[index + 1] : null

  /**
   * Accusé de lecture (#419) : posé à l'OUVERTURE du détail, sans bouton.
   *
   * Un « j'ai lu » à cliquer crée une corvée et une culpabilité. Le geste qui atteste
   * qu'un humain a regardé, c'est d'avoir ouvert la passation.
   *
   * Déclenché sur l'identité de la passation affichée, donc à chaque changement de
   * sélection. La base ne retient que la première ouverture : rappeler ne déplace
   * jamais la date, et le patient n'apprend pas combien de fois on a rouvert sa
   * passation.
   */
  const { mutate: markRead } = useMarkPassationRead()
  const selectedId = selected?.id ?? null
  useEffect(() => {
    if (selectedId == null) return
    markRead({ patientId, localId: selectedId, moduleId: moduleType })
  }, [markRead, patientId, selectedId, moduleType])

  if (passationsQuery.isLoading || fieldsQuery.isLoading) {
    return (
      <div className="module-data-panel">
        <p className="module-data-panel__message">{t('common.loading')}</p>
      </div>
    )
  }

  if (selected == null) {
    return (
      <div className="module-data-panel">
        <p className="module-data-panel__message">{t('scales.entry_detail.empty')}</p>
      </div>
    )
  }

  return (
    <div className="module-data-panel spd-panel">
      <div className="spd-panel__layout">
        <ScalePassationList
          passations={records}
          selectedIndex={index}
          locale={i18n.language}
          title={t('scales.entry_detail.list_title')}
          onSelect={handleSelect}
        />
        <ScalePassationDetail
          fields={fieldsQuery.data?.fields ?? []}
          passation={selected}
          previous={previous}
          scaleLabel={t(`modules.${moduleType}.label`)}
          nextDueIso={nextDueIso}
          locale={i18n.language}
          t={t}
        />
      </div>
    </div>
  )
}
