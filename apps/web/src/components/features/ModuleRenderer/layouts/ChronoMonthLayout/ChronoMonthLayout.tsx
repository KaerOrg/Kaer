import { CalendarDays } from 'lucide-react'

// Aperçu praticien du layout 'chrono_month' : preview statique pour
// indiquer qu'il existe une vue calendaire mensuelle des 5 ancrages
// chronobiologiques côté patient. Le rendu réel (grille + bande de
// rythme SVG) vit côté mobile (apps/mobile/.../ChronoMonth).
export function ChronoMonthLayout() {
  return (
    <div className="chrono-month">
      <div className="chrono-month__icon-wrap">
        <CalendarDays size={36} />
      </div>
      <div className="chrono-month__title">Vue mensuelle des ancrages</div>
      <div className="chrono-month__hint">
        Calendrier de densité (jours saisis) + bande de rythme avec les 5
        ancrages quotidiens positionnés par heure (axe 0–24h).
      </div>
      <div className="chrono-month__grid">
        {Array.from({ length: 35 }).map((_, i) => (
          <span
            key={i}
            className={`chrono-month__cell${i % 4 === 0 ? ' chrono-month__cell--filled' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
