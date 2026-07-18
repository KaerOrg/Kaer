import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkline } from '@ui/Chart'
import { DimensionFingerprint } from '../DimensionFingerprint'
import type { OverviewCard } from '../../../pages/PatientPage/tabs/overviewMetrics'

// ─── Mini-carte du bandeau d'aperçu Évolution (#159) ─────────────────────────
//
// Une carte par module actif. Chiffre = moyenne 30 j glissants (fenêtre fixe),
// libellé « 30 derniers jours ». Humeur = mini-empreinte (aucun agrégat, MDR).
// Trop peu de saisies → carte grisée « en attente de saisies » (sans sparkline).
//
// La carte entière est une SURFACE de navigation : `<button>` reset (ancre de
// scroll vers la section détaillée), pas un bouton habillé. Carte active (module
// en cours de lecture) surlignée + badge. Leaf mémoïsé à callback stable.

export interface EvolutionOverviewCardProps {
  readonly card: OverviewCard
  readonly active: boolean
  readonly onNavigate: (moduleType: string) => void
}

export const EvolutionOverviewCard = memo(function EvolutionOverviewCard({
  card, active, onNavigate,
}: EvolutionOverviewCardProps) {
  const { t } = useTranslation()
  const handleClick = useCallback(() => onNavigate(card.moduleType), [onNavigate, card.moduleType])
  const label = t(card.labelKey)

  return (
    <button
      type="button"
      className={`evo-ov-card${active ? ' evo-ov-card--active' : ''}${card.kind === 'empty' ? ' evo-ov-card--empty' : ''}`}
      style={active ? { borderTopColor: card.color, boxShadow: `0 0 0 3px ${card.color}2e` } : undefined}
      onClick={handleClick}
      aria-label={label}
    >
      <span className="evo-ov-card__head">
        <span className="evo-ov-card__dot" style={{ background: card.color }} />
        <span className="evo-ov-card__name">{label}</span>
        {active ? <span className="evo-ov-card__badge" style={{ color: card.color }}>{t('evolution.overview_reading')}</span> : null}
      </span>

      {card.kind === 'metric' ? (
        <>
          <span className="evo-ov-card__metric">
            <span className="evo-ov-card__value">{card.value ?? '-'}</span>
            <span className="evo-ov-card__unit">{card.unit}</span>
          </span>
          <span className="evo-ov-card__sub">{t(card.metricLabelKey)}</span>
          <span className="evo-ov-card__spark">
            <Sparkline data={card.sparkline} color={card.color} domain={card.domain} height={30} />
          </span>
          <span className="evo-ov-card__window">{t('evolution.overview_window')}</span>
        </>
      ) : null}

      {card.kind === 'fingerprint' ? (
        <>
          <span className="evo-ov-card__fp">
            <DimensionFingerprint bars={card.bars} yMax={10} barAreaHeight={28} showValues={false} />
          </span>
          <span className="evo-ov-card__window">{t('evolution.overview_window')}</span>
        </>
      ) : null}

      {card.kind === 'empty' ? (
        <span className="evo-ov-card__empty">{t('evolution.overview_empty')}</span>
      ) : null}
    </button>
  )
})
