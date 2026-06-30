import { useEffect, useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Lightbulb, CheckCircle2, Check } from 'lucide-react'
import { fetchBlocksByTopic, type PsyEduBlock } from '@services/psyeduService'

interface Props {
  topicId: string
  sectionOrder: Readonly<Record<string, number>>
}

function sortBlocks(
  blocks: readonly PsyEduBlock[],
  sectionOrder: Readonly<Record<string, number>>
): PsyEduBlock[] {
  return [...blocks].sort((a, b) => {
    const sa = sectionOrder[a.section_key] ?? 99
    const sb = sectionOrder[b.section_key] ?? 99
    if (sa !== sb) return sa - sb
    return a.sort_order - b.sort_order
  })
}

// Rend la version inline (italique pour *X*, gras pour **X**) d'un texte
// résolu depuis i18next. Aligné sur le InlineText mobile.
function renderInline(text: string): ReactElement[] {
  const parts: ReactElement[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>)
    }
    const token = match[0]
    if (token.startsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>)
    }
    lastIndex = match.index + token.length
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>)
  }
  return parts
}

// Aperçu praticien des psyedu_blocks d'un topic. Lit la BDD à la demande
// et rend les 6 types de blocs (heading, paragraph, bullet_list, tip,
// blockquote, source_link) en HTML/CSS — équivalent web du
// PsyEduBlockRenderer mobile.
export function PsyEduBlocks({ topicId, sectionOrder }: Props) {
  const { t } = useTranslation()
  const [blocks, setBlocks] = useState<readonly PsyEduBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchBlocksByTopic(topicId)
      .then(data => {
        if (!cancelled) setBlocks(sortBlocks(data, sectionOrder))
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [topicId, sectionOrder])

  if (loading) {
    return <div className="psyedu__body psyedu__body--loading">{t('common.loading')}</div>
  }

  if (error) {
    return <div className="psyedu__body psyedu__body--error">{t('common.error')}</div>
  }

  if (blocks.length === 0) {
    return (
      <div className="psyedu__body psyedu__body--empty">
        Aucun bloc psyedu_blocks pour cette fiche.
      </div>
    )
  }

  const seenSections = new Set<string>()

  return (
    <div className="psyedu__body">
      {blocks.map(block => {
        const showSectionLabel = !seenSections.has(block.section_key)
        seenSections.add(block.section_key)
        const sectionLabel = showSectionLabel
          ? t(`section.${block.section_key}`, {
              ns: 'psyedu',
              defaultValue: block.section_key,
            })
          : null

        let content: ReactElement | null = null
        switch (block.block_type) {
          case 'heading':
            content = block.text_code ? (
              <h4 className="psyedu-block psyedu-block--heading">
                {t(block.text_code, { ns: 'psyedu', defaultValue: block.text_code })}
              </h4>
            ) : null
            break

          case 'paragraph':
            content = block.text_code ? (
              <p className="psyedu-block psyedu-block--paragraph">
                {renderInline(t(block.text_code, { ns: 'psyedu', defaultValue: block.text_code }))}
              </p>
            ) : null
            break

          case 'bullet_list':
            content = block.items_codes ? (
              <ul className="psyedu-block psyedu-block--list">
                {block.items_codes.map((code, i) => (
                  <li key={i} className="psyedu-block__list-item">
                    {renderInline(t(code, { ns: 'psyedu', defaultValue: code }))}
                  </li>
                ))}
              </ul>
            ) : null
            break

          case 'action_list':
            content = block.items_codes ? (
              <div className="psyedu-block psyedu-block--action">
                <div className="psyedu-block__action-title">
                  <CheckCircle2 size={16} />
                  {block.text_code
                    ? t(block.text_code, { ns: 'psyedu', defaultValue: block.text_code })
                    : t('section.actions', { ns: 'psyedu', defaultValue: 'Ce que je peux faire' })}
                </div>
                <ul className="psyedu-block__action-list">
                  {block.items_codes.map((code, i) => (
                    <li key={i} className="psyedu-block__action-item">
                      <Check size={15} />
                      <span>{renderInline(t(code, { ns: 'psyedu', defaultValue: code }))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
            break

          case 'tip':
            content = block.text_code ? (
              <div className="psyedu-block psyedu-block--tip">
                <Lightbulb size={14} className="psyedu-block__tip-icon" />
                <span>
                  {renderInline(t(block.text_code, { ns: 'psyedu', defaultValue: block.text_code }))}
                </span>
              </div>
            ) : null
            break

          case 'blockquote':
            content = block.text_code ? (
              <blockquote className="psyedu-block psyedu-block--quote">
                {renderInline(t(block.text_code, { ns: 'psyedu', defaultValue: block.text_code }))}
              </blockquote>
            ) : null
            break

          case 'source_link':
            content = block.text_code ? (
              <a
                className="psyedu-block psyedu-block--source"
                href={block.href ?? undefined}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  {t(block.text_code, { ns: 'psyedu', defaultValue: block.text_code })}
                </span>
                {block.href ? <ExternalLink size={12} /> : null}
              </a>
            ) : null
            break
        }

        return (
          <div key={block.id}>
            {sectionLabel ? (
              <div className="psyedu-block__section-label">{sectionLabel}</div>
            ) : null}
            {content}
          </div>
        )
      })}
    </div>
  )
}
