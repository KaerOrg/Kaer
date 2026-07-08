import { useCallback, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { InputField } from '@ui/InputField'
import type { useCrisisPlanEditor } from '../hooks/useCrisisPlanEditor'

type CrisisEditor = ReturnType<typeof useCrisisPlanEditor>

// Alignement à droite du bouton « supprimer » d'une coping card (positionnement pur).
const CARD_DELETE_STYLE: CSSProperties = { alignSelf: 'flex-end' }

interface Props {
  crisis: CrisisEditor
  /** Ferme la modale d'actions — appelée après un enregistrement réussi ou une annulation. */
  onClose: () => void
}

/**
 * Onglet Configuration du module Plan de crise : message du praticien, phrase
 * d'engagement et cartes « pensée → réponse » (max 4). Édition en state local amorcée
 * du serveur ; « Enregistrer » persiste puis ferme la modale, « Annuler » ferme sans
 * enregistrer.
 */
export function CrisisPlanConfigPanel({ crisis, onClose }: Props) {
  const { t } = useTranslation()

  const handleSave = useCallback(async () => {
    const ok = await crisis.saveEditor()
    if (ok) onClose()
  }, [crisis, onClose])

  return (
    <div className="psycho-card-picker">
      <p className="psycho-card-picker__label">{t('patient.crisis_editor_title')}</p>
      <div className="module-editor-fields">
        <InputField
          label={t('patient.crisis_msg_label')}
          multiline
          rows={3}
          placeholder={t('patient.crisis_msg_placeholder')}
          value={crisis.config.practitionerMessage}
          onChange={e => crisis.setConfig(prev => ({ ...prev, practitionerMessage: e.target.value }))}
        />
        <InputField
          label={t('patient.crisis_commitment_label')}
          multiline
          rows={3}
          placeholder={t('patient.crisis_commitment_placeholder')}
          value={crisis.config.commitmentPhrase}
          onChange={e => crisis.setConfig(prev => ({ ...prev, commitmentPhrase: e.target.value }))}
        />
        <div>
          <p className="crisis-cards-title">{t('patient.crisis_cards_title')}</p>
          {crisis.config.copingCards.map(card => (
            <div key={card.id} className="crisis-card">
              <div className="crisis-card__meta">{t('patient.crisis_card_thought_label')}</div>
              <div className="crisis-card__text crisis-card__text--italic">{card.thought}</div>
              <div className="crisis-card__meta crisis-card__meta--spaced">{t('patient.crisis_card_response_label')}</div>
              <div className="crisis-card__text crisis-card__text--strong">{card.response}</div>
              <Button
                type="button"
                variant="ghost"
                category="danger"
                size="xs"
                onClick={() => crisis.removeCopingCard(card.id)}
                style={CARD_DELETE_STYLE}
              >
                {t('patient.crisis_card_delete')}
              </Button>
            </div>
          ))}
          {crisis.config.copingCards.length < 4 && (
            crisis.cardDraft ? (
              <div className="crisis-card-draft">
                <InputField
                  label={t('patient.crisis_card_thought_label')}
                  multiline
                  required
                  rows={2}
                  placeholder={t('patient.crisis_card_thought_placeholder')}
                  value={crisis.cardDraft.thought}
                  onChange={e => crisis.setCardDraft(prev => prev ? { ...prev, thought: e.target.value } : null)}
                />
                <InputField
                  label={t('patient.crisis_card_response_label')}
                  multiline
                  required
                  rows={2}
                  placeholder={t('patient.crisis_card_response_placeholder')}
                  value={crisis.cardDraft.response}
                  onChange={e => crisis.setCardDraft(prev => prev ? { ...prev, response: e.target.value } : null)}
                />
                <div className="crisis-draft-actions">
                  <Button
                    size="sm"
                    onClick={crisis.addCopingCard}
                    disabled={!crisis.cardDraft.thought.trim() || !crisis.cardDraft.response.trim()}
                  >
                    {t('patient.crisis_card_save')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => crisis.setCardDraft(null)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={crisis.addCopingCard}>
                + {t('patient.crisis_cards_add')}
              </Button>
            )
          )}
        </div>
      </div>
      <div className="psycho-card-picker__actions">
        <Button size="sm" loading={crisis.saving} onClick={handleSave}>
          {t('patient.crisis_btn_save')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}
