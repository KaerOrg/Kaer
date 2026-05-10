import { BookOpen, ChevronRight } from 'lucide-react'

interface Props {
  t: (key: string) => string
}

// Aperçu praticien du layout psyedu : liste de fiches psychoéducatives
// (psyedu_topics) avec titre + résumé. Les vraies données viennent des
// tables `psyedu_topics` / `psyedu_blocks` côté patient mobile — ici on
// affiche un mock générique pour visualiser la structure.
const MOCK_TOPICS: ReadonlyArray<{ id: string; title: string; summary: string }> = [
  { id: 't1', title: 'Comprendre le mécanisme', summary: 'Définition, déclencheurs, modèle TCC' },
  { id: 't2', title: 'Reconnaître mes signaux', summary: 'Cadre ABC : Antécédent → Comportement → Conséquence' },
  { id: 't3', title: 'Une technique éprouvée', summary: 'Exercice guidé étape par étape' },
  { id: 't4', title: 'Pour aller plus loin', summary: 'Sources et lectures recommandées' },
]

export function PsyEduLayout({ t: _t }: Props) {
  return (
    <div className="psyedu">
      <div className="psyedu__intro">
        <BookOpen size={14} className="psyedu__intro-icon" />
        <span className="psyedu__intro-text">Fiches psychoéducatives — contenu en lecture seule</span>
      </div>

      <ul className="psyedu__list">
        {MOCK_TOPICS.map(topic => (
          <li key={topic.id} className="psyedu__row">
            <div className="psyedu__row-icon">
              <BookOpen size={18} />
            </div>
            <div className="psyedu__row-text">
              <span className="psyedu__row-title">{topic.title}</span>
              <span className="psyedu__row-summary">{topic.summary}</span>
            </div>
            <ChevronRight size={16} className="psyedu__row-chevron" />
          </li>
        ))}
      </ul>
    </div>
  )
}
