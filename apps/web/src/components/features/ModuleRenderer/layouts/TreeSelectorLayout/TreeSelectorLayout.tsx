import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronRight, Info, Plus } from 'lucide-react'
import { collectIndexed } from '@kaer/shared'
import type { ContentField } from '../../../../../services/moduleService'

interface Props {
  fields: ContentField[]
  footer?: ContentField
  t: (key: string) => string
}

type Mode = 'history' | 'selection' | 'intensity' | 'context' | 'notes'
const ROOT = '__root__'

// Aperçu praticien INTERACTIF, miroir fidèle du flux patient mobile
// (preview_kind 'tree_selector', module emotion_wheel) : grille des familles
// (emoji + couleur) → nuances → mots, puis intensité, contexte (chips) et note.
// Lecture seule : « Enregistrer » revient à l'historique sans persister.
// Source mobile : layouts/TreeSelector/TreeSelectorLayout.tsx.
export function TreeSelectorLayout({ fields, footer, t }: Props) {
  const config = fields.find(f => f.field_type === 'tree_selector_config')
  const props = useMemo(() => config?.props ?? {}, [config])
  const lbl = (key: string): string => {
    const code = props[key]
    return code ? t(code) : ''
  }

  const enableIntensity = props['enable_intensity'] === '1'
  const enableContext = props['enable_context'] === '1'
  const enableNotes = props['enable_notes'] === '1'
  const enableEarly = props['enable_early_validate'] === '1'
  const intensityMin = parseInt(props['intensity_min'] ?? '1', 10)
  const intensityMax = parseInt(props['intensity_max'] ?? '10', 10)
  const intensityValues = useMemo(() => {
    const out: number[] = []
    for (let v = intensityMin; v <= intensityMax; v += 1) out.push(v)
    return out
  }, [intensityMin, intensityMax])
  const contextOptions = useMemo(() => {
    const codes = collectIndexed(props, 'context_opt')
    const icons = collectIndexed(props, 'context_icon')
    return codes.map((code, i) => ({ code, icon: icons[i] }))
  }, [props])

  // fetchModuleFields renvoie un arbre imbriqué (enfants dans `.children`) :
  // on parcourt récursivement pour indexer chaque nœud par son parent.
  const childrenOf = useMemo(() => {
    const map = new Map<string, ContentField[]>()
    const walk = (f: ContentField) => {
      if (f.field_type === 'tree_node') {
        const key = f.parent_field_id ?? ROOT
        const arr = map.get(key) ?? []
        arr.push(f)
        map.set(key, arr)
      }
      for (const c of f.children ?? []) walk(c)
    }
    for (const f of fields) walk(f)
    for (const arr of map.values()) arr.sort((a, b) => a.sort_order - b.sort_order)
    return map
  }, [fields])
  const roots = childrenOf.get(ROOT) ?? []

  const midIntensity = Math.round((intensityMin + intensityMax) / 2)
  const [mode, setMode] = useState<Mode>('history')
  const [path, setPath] = useState<ContentField[]>([])
  const [intensity, setIntensity] = useState(midIntensity)
  const [context, setContext] = useState<string[]>([])

  const accent = useMemo(() => {
    for (let i = path.length - 1; i >= 0; i -= 1) {
      const c = path[i].props['color']
      if (c) return c
    }
    return 'var(--color-primary)'
  }, [path])
  const currentNodes = path.length === 0 ? roots : (childrenOf.get(path[path.length - 1].id) ?? [])
  const level = path.length + 1
  const breadcrumb = path.map(n => (n.text_code ? t(n.text_code) : '')).filter(Boolean).join(' › ')
  const tint = accent.startsWith('#') ? `${accent}14` : 'var(--color-surface)'

  const reset = () => { setPath([]); setIntensity(midIntensity); setContext([]) }
  const proceed = (p: ContentField[]) => {
    setPath(p)
    if (enableIntensity) { setMode('intensity'); return }
    if (enableContext) { setMode('context'); return }
    if (enableNotes) { setMode('notes'); return }
    reset(); setMode('history')
  }
  const selectNode = (n: ContentField) => {
    const np = [...path, n]
    if ((childrenOf.get(n.id) ?? []).length > 0) { setPath(np); return }
    proceed(np)
  }
  const back = () => {
    if (mode === 'notes') { setMode(enableContext ? 'context' : enableIntensity ? 'intensity' : 'selection'); return }
    if (mode === 'context') { setMode(enableIntensity ? 'intensity' : 'selection'); return }
    if (mode === 'intensity') { setMode('selection'); return }
    if (path.length > 0) { setPath(p => p.slice(0, -1)); return }
    setMode('history')
  }
  const toggleCtx = (c: string) => setContext(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const header = (showProgress: boolean) => (
    <div className="ts-head">
      <button type="button" className="ts-back" onClick={back} aria-label="back"><ArrowLeft size={20} /></button>
      {showProgress && (
        <div className="ts-progress">
          <div className="ts-progress__track"><div className="ts-progress__fill" style={{ width: `${(level / Math.max(level, 3)) * 100}%`, background: accent }} /></div>
          {breadcrumb && <span className="ts-progress__label">{breadcrumb}</span>}
        </div>
      )}
    </div>
  )

  // ── Historique ─────────────────────────────────────────────────────────────
  if (mode === 'history') {
    const intro = lbl('intro')
    const newBtn = lbl('new_btn')
    const historyLabel = lbl('history_label')
    const emptyTitle = lbl('empty_title')
    const emptyText = lbl('empty_text')
    return (
      <div className="ts">
        {intro && <p className="ts-intro">{intro}</p>}
        {newBtn && (
          <button type="button" className="ts-new-btn" onClick={() => { reset(); setMode('selection') }}>
            <Plus size={16} />
            <span>{newBtn}</span>
          </button>
        )}
        {historyLabel && (
          <section className="ts-section">
            <span className="ts-section__title">{historyLabel}</span>
            {(emptyTitle || emptyText) && (
              <div className="ts-history-empty">
                {emptyTitle && <span className="ts-history-empty__title">{emptyTitle}</span>}
                {emptyText && <span className="ts-history-empty__text">{emptyText}</span>}
              </div>
            )}
          </section>
        )}
        {footer?.text_code && (
          <p className="ts-footer"><Info size={13} /><span>{t(footer.text_code)}</span></p>
        )}
      </div>
    )
  }

  // ── Sélection (arbre) ────────────────────────────────────────────────────────
  if (mode === 'selection') {
    const showValidate = enableEarly && path.length > 0 && currentNodes.length > 0
    const validateLabel = lbl('validate_here_btn')
    const lastLabel = path.length > 0 && path[path.length - 1].text_code ? t(path[path.length - 1].text_code!) : ''
    const stepTitle = level === 2 && path[0]?.text_code ? t(path[0].text_code) : lbl(`step_${level}_title`)
    return (
      <div className="ts" style={{ background: tint }}>
        {header(true)}
        {stepTitle && <span className="ts-step-title">{stepTitle}</span>}
        {lbl(`step_${level}_hint`) && <span className="ts-step-hint">{lbl(`step_${level}_hint`)}</span>}

        {level === 1 ? (
          <div className="ts-primary-grid">
            {currentNodes.map(node => {
              const color = node.props['color'] ?? 'var(--color-primary)'
              const nodeTint = color.startsWith('#') ? `${color}12` : 'var(--color-surface)'
              return (
                <button
                  key={node.id}
                  type="button"
                  className="ts-primary"
                  style={{ borderColor: color, background: nodeTint }}
                  onClick={() => selectNode(node)}
                >
                  {node.props['emoji'] && <span className="ts-primary__emoji">{node.props['emoji']}</span>}
                  <span className="ts-primary__label" style={{ color }}>{node.text_code ? t(node.text_code) : ''}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="ts-options">
            {currentNodes.map(node => {
              const color = node.props['color'] ?? accent
              return (
                <button key={node.id} type="button" className="ts-option" style={{ borderLeftColor: color }} onClick={() => selectNode(node)}>
                  <span className="ts-option__label" style={{ color }}>{node.text_code ? t(node.text_code) : ''}</span>
                  <ChevronRight size={18} />
                </button>
              )
            })}
          </div>
        )}

        {showValidate && (
          <button type="button" className="ts-validate" style={{ borderColor: accent, color: accent }} onClick={() => proceed(path)}>
            <Check size={16} />
            <span>{lastLabel ? `${validateLabel} : ${lastLabel}` : validateLabel}</span>
          </button>
        )}

        {level === 1 && footer?.text_code && (
          <p className="ts-footer"><Info size={13} /><span>{t(footer.text_code)}</span></p>
        )}
      </div>
    )
  }

  // ── Intensité ────────────────────────────────────────────────────────────────
  if (mode === 'intensity') {
    return (
      <div className="ts" style={{ background: tint }}>
        {header(false)}
        {lbl('intensity_title') && <span className="ts-step-title">{lbl('intensity_title')}</span>}
        {lbl('intensity_hint') && <span className="ts-step-hint">{lbl('intensity_hint')}</span>}
        <div className="ts-intensity">
          <div className="ts-intensity__value" style={{ background: tint, color: accent }}>
            <strong>{intensity}</strong><span>/{intensityMax}</span>
          </div>
          <div className="ts-intensity__grid">
            {intensityValues.map(v => (
              <button
                key={v}
                type="button"
                className="ts-intensity__btn"
                style={intensity === v ? { background: accent, borderColor: accent, color: 'white' } : undefined}
                onClick={() => setIntensity(v)}
              >{v}</button>
            ))}
          </div>
        </div>
        <button type="button" className="ts-continue" style={{ background: accent }} onClick={() => setMode(enableContext ? 'context' : enableNotes ? 'notes' : 'history')}>
          <span>{lbl('continue_btn')}</span><ArrowRight size={18} />
        </button>
      </div>
    )
  }

  // ── Contexte (chips) ─────────────────────────────────────────────────────────
  if (mode === 'context') {
    return (
      <div className="ts" style={{ background: tint }}>
        {header(false)}
        {lbl('context_title') && <span className="ts-step-title">{lbl('context_title')}</span>}
        {lbl('context_hint') && <span className="ts-step-hint">{lbl('context_hint')}</span>}
        <div className="ts-chips">
          {contextOptions.map(opt => {
            const active = context.includes(opt.code)
            return (
              <button
                key={opt.code}
                type="button"
                className="ts-chip"
                style={active ? { borderColor: accent, color: accent, background: accent.startsWith('#') ? `${accent}1A` : undefined } : undefined}
                onClick={() => toggleCtx(opt.code)}
              >{t(opt.code)}</button>
            )
          })}
        </div>
        <button type="button" className="ts-continue" style={{ background: accent }} onClick={() => setMode(enableNotes ? 'notes' : 'history')}>
          <span>{lbl('continue_btn')}</span><ArrowRight size={18} />
        </button>
      </div>
    )
  }

  // ── Note ─────────────────────────────────────────────────────────────────────
  const summary = path.map(n => (n.text_code ? t(n.text_code) : '')).filter(Boolean).join(' — ')
  return (
    <div className="ts" style={{ background: tint }}>
      {header(false)}
      {lbl('notes_title') && <span className="ts-step-title">{lbl('notes_title')}</span>}
      {lbl('notes_hint') && <span className="ts-step-hint">{lbl('notes_hint')}</span>}
      {summary && (
        <div className="ts-summary" style={{ borderLeftColor: accent }}>
          <span style={{ color: accent, fontWeight: 700 }}>{summary}</span>
          {enableIntensity && <span className="ts-summary__meta">{intensity}/{intensityMax}</span>}
        </div>
      )}
      <textarea className="ts-notes" placeholder={lbl('notes_placeholder')} rows={4} readOnly />
      <div className="ts-actions">
        <button type="button" className="ts-cancel" onClick={() => { reset(); setMode('history') }}>{t('common.cancel')}</button>
        <button type="button" className="ts-save" style={{ background: accent }} onClick={() => { reset(); setMode('history') }}>
          <span>{lbl('save_btn')}</span><Check size={18} />
        </button>
      </div>
    </div>
  )
}
