// Aperçu d'un curseur SUDS (0–100, pas de 10) — valeur figée mise en avant.
// MDR : affichage brut, couleur = convention temporelle (avant/pic/après), pas
// un codage de gravité clinique.

interface Props {
  value: number
  /** Couleur d'accent (token CSS, ex. var(--color-danger)). */
  color: string
}

const PIPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

export function SudsPickerPreview({ value, color }: Props) {
  return (
    <div className="ej-suds-picker">
      <div className="ej-suds-picker__big" style={{ color }}>{value}</div>
      <div className="ej-suds-picker__pips">
        {PIPS.map(v => {
          const on = v === value
          return (
            <span
              key={v}
              className={`ej-pip${on ? ' ej-pip--on' : ''}`}
              style={on ? { borderColor: color, color, background: 'var(--color-primary-light)' } : undefined}
            >
              {v}
            </span>
          )
        })}
      </div>
    </div>
  )
}
