import { useState } from 'react'
import './Accordion.css'
import type { AccordionProps } from './Accordion.types'

export function Accordion({ title, icon, subtitle, badge, defaultOpen = false, children, className = '' }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`accordion ${open ? 'accordion--open' : ''} ${className}`}>
      <button className="accordion__trigger" onClick={() => setOpen(o => !o)} type="button">
        <div className="accordion__trigger-labels">
          <span className="accordion__title">
            {icon ? <span className="accordion__title-icon">{icon}</span> : null}
            {title}
          </span>
          {subtitle ? <span className="accordion__subtitle">{subtitle}</span> : null}
        </div>
        <div className="accordion__trigger-meta">
          {badge !== undefined ? <span className="accordion__badge">{badge}</span> : null}
          <span className="accordion__chevron">›</span>
        </div>
      </button>
      {open ? <div className="accordion__body">{children}</div> : null}
    </div>
  )
}
