// ─── Onglet « Le plan » : l'éditeur des six étapes (PW-2) ───────────────────
//
// Il remplace un champ unique. Jusqu'ici, `crisis_plan_configs` ne portait que
// `practitioner_message`, et « Plan personnalisé » s'affichait dès que trois mots y
// étaient écrits, sur un plan par ailleurs vide : **le praticien ne pouvait ni lire ni
// écrire une ligne du plan**. C'est ce que PW-1 a rendu possible, et ce panneau l'expose.
//
// À gauche, les six étapes avec leur décompte et la marque « vide » : c'est le seul
// endroit d'où l'on voit d'un coup ce qui manque. À droite, l'étape ouverte et son
// formulaire d'ajout.
//
// ── Interdits, tenus par ce composant ───────────────────────────────────────
//
// **Aucun pourcentage de complétion.** « 3 étapes remplies sur 6 » est un décompte,
// « plan complété à 50 % » serait une évaluation.
// **Aucune bibliothèque de suggestions à cocher** : un item doit être dans les mots du
// patient, c'est la condition pour qu'il le retrouve en crise.
// **Aucune suppression sans annulation possible.**
// **Un item sans numéro n'est pas une erreur** : mention neutre, jamais de rouge, et
// l'interface dit la conséquence côté patient plutôt que de bloquer la saisie.

import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Banner } from '@ui/Banner'
import { Button } from '@ui/Button'
import { InputField } from '@ui/InputField'
import { crisisQueries } from '../../../hooks/queries'
import { useToast } from '../../../contexts/ToastContext'
import {
  saveSafetyPlanItem,
  deleteSafetyPlanItem,
  type SafetyPlanItem,
} from '@services/safetyPlanItemsService'
import { buildStepSummaries, groupBySection, nextSortOrder } from './safetyPlanEditorLogic'
import { StepList } from './StepList'
import { PlanItemRow } from './PlanItemRow'
import './SafetyPlanEditorPanel.css'

interface Props {
  patientId: string
  /** Les six étapes, dans l'ordre de la configuration, libellés déjà traduits. */
  sections: readonly { sectionId: string; label: string }[]
}

export function SafetyPlanEditorPanel({ patientId, sections }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [openSection, setOpenSection] = useState(sections[0]?.sectionId ?? '')
  const [draft, setDraft] = useState('')
  const [draftPhone, setDraftPhone] = useState('')
  // Dernier item supprimé, gardé pour l'annulation : aucune suppression n'est définitive
  // sans que le praticien ait eu le moyen de revenir en arrière.
  const [undoable, setUndoable] = useState<SafetyPlanItem | null>(null)

  const itemsQuery = useQuery(crisisQueries.planItems(patientId))
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data])

  const summaries = useMemo(() => buildStepSummaries(sections, items), [sections, items])
  const openItems = useMemo(() => groupBySection(items).get(openSection) ?? [], [items, openSection])

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: crisisQueries.planItems(patientId).queryKey })
  }, [queryClient, patientId])

  const saveMutation = useMutation({
    mutationFn: (item: Parameters<typeof saveSafetyPlanItem>[1]) => saveSafetyPlanItem(patientId, item),
    onSuccess: invalidate,
    onError: () => toast.error(t('common.save_error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSafetyPlanItem(patientId, id),
    onSuccess: invalidate,
    onError: () => toast.error(t('common.save_error')),
  })

  // Le formulaire n'exige que le texte : un numéro, un rôle ou une note sont des
  // précisions, pas des conditions.
  const handleAdd = useCallback(() => {
    if (draft.trim() === '') return
    saveMutation.mutate({
      section_id: openSection,
      text: draft.trim(),
      phone: draftPhone.trim() === '' ? null : draftPhone.trim(),
      sort_order: nextSortOrder(openItems),
    })
    setDraft('')
    setDraftPhone('')
  }, [draft, draftPhone, openSection, openItems, saveMutation])

  const handleDelete = useCallback((item: SafetyPlanItem) => {
    setUndoable(item)
    deleteMutation.mutate(item.id)
  }, [deleteMutation])

  // L'annulation réécrit l'item tel qu'il était, son identifiant compris : ce n'est pas
  // un nouvel item, c'est celui qu'on remet.
  const handleUndo = useCallback(() => {
    if (undoable == null) return
    saveMutation.mutate({
      id: undoable.id,
      section_id: undoable.section_id,
      text: undoable.text,
      kind: undoable.kind,
      role: undoable.role,
      note: undoable.note,
      phone: undoable.phone,
      sort_order: undoable.sort_order,
    })
    setUndoable(null)
  }, [undoable, saveMutation])

  const handleDraft = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value), [])
  const handleDraftPhone = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setDraftPhone(e.target.value), [])

  return (
    <div className="plan-editor">
      {/* Aucune suppression sans annulation possible : le bandeau porte l'action, via
          la prop du primitive plutôt qu'un bouton glissé dans son contenu. */}
      {undoable != null ? (
        <Banner variant="info" action={{ label: t('common.undo'), onClick: handleUndo }}>
          {t('modules.crisis_plan.item_deleted')}
        </Banner>
      ) : null}

      <div className="plan-editor__columns">
        <StepList
          summaries={summaries}
          openSection={openSection}
          emptyLabel={t('modules.crisis_plan.step_empty_mark')}
          onOpen={setOpenSection}
        />

        <section className="plan-editor__detail">
          <ul className="plan-editor__items">
            {openItems.map(item => (
              <PlanItemRow
                key={item.id}
                item={item}
                noPhoneLabel={t('modules.crisis_plan.item_no_phone')}
                deleteLabel={t('common.delete')}
                onDelete={handleDelete}
              />
            ))}
          </ul>

          <div className="plan-editor__form">
            <InputField
              label={t('modules.crisis_plan.item_text_label')}
              value={draft}
              onChange={handleDraft}
              data-testid="plan-item-text"
            />
            <InputField
              label={t('modules.crisis_plan.item_phone_label')}
              value={draftPhone}
              onChange={handleDraftPhone}
              data-testid="plan-item-phone"
            />
            <Button variant="primary" size="sm" onClick={handleAdd}>{t('modules.crisis_plan.add_item')}</Button>
          </div>
        </section>
      </div>
    </div>
  )
}
