import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react'

// Aperçu praticien du layout psyedu : liste de fiches psychoéducatives
// (psyedu_topics) avec titre + résumé. Les vraies données viennent des
// tables `psyedu_topics` / `psyedu_blocks` côté patient mobile — ici on
// affiche un mock générique pour visualiser la structure.
const MOCK_TOPICS: ReadonlyArray<{
  id: string
  title: string
  summary: string
  body: string
}> = [
  {
    id: 't1',
    title: 'Comprendre le mécanisme',
    summary: 'Définition, déclencheurs, modèle TCC',
    body: 'Court paragraphe d\'introduction. Côté patient, les blocs sont rendus depuis psyedu_blocks (heading, paragraph, bullet_list, tip, blockquote, source_link).',
  },
  {
    id: 't2',
    title: 'Reconnaître mes signaux',
    summary: 'Cadre ABC : Antécédent → Comportement → Conséquence',
    body: 'Le contenu de cette fiche est défini dans psyedu_blocks (sections why / how / sources, triées côté client).',
  },
  {
    id: 't3',
    title: 'Une technique éprouvée',
    summary: 'Exercice guidé étape par étape',
    body: 'Liste à puces et encart « tip » disponibles via psyedu_blocks. Le rendu mobile utilise PsyEduBlockRenderer.',
  },
  {
    id: 't4',
    title: 'Pour aller plus loin',
    summary: 'Sources et lectures recommandées',
    body: 'Les sources cliquables (HAS, NICE, articles) sont des blocs source_link avec un href.',
  },
]

export function PsyEduLayout() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="psyedu">
      <div className="psyedu__intro">
        <BookOpen size={14} className="psyedu__intro-icon" />
        <span className="psyedu__intro-text">
          Fiches psychoéducatives — appuyez sur une fiche pour prévisualiser
        </span>
      </div>

      <ul className="psyedu__list">
        {MOCK_TOPICS.map(topic => {
          const isOpen = openId === topic.id
          return (
            <li key={topic.id} className="psyedu__item">
              <button
                type="button"
                className={`psyedu__row${isOpen ? ' psyedu__row--open' : ''}`}
                onClick={() => setOpenId(isOpen ? null : topic.id)}
                aria-expanded={isOpen}
              >
                <div className="psyedu__row-icon">
                  <BookOpen size={18} />
                </div>
                <div className="psyedu__row-text">
                  <span className="psyedu__row-title">{topic.title}</span>
                  <span className="psyedu__row-summary">{topic.summary}</span>
                </div>
                {isOpen ? (
                  <ChevronDown size={16} className="psyedu__row-chevron" />
                ) : (
                  <ChevronRight size={16} className="psyedu__row-chevron" />
                )}
              </button>
              {isOpen ? (
                <div className="psyedu__body">{topic.body}</div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
