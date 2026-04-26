// ASRS v1.1 — Adult ADHD Self-Report Scale, Screener (Part A, 6 items)
// Kessler RC et al. — The World Health Organization Adult ADHD Self-Report Scale (ASRS):
// a short screening scale for use in the general population. Psychol Med 2005;35(2):245-256.
// Traduction française officielle OMS. Auto-évaluation adulte (18+).
// ⚠️ Vérifier le libellé exact de chaque item contre le PDF officiel OMS avant mise en production.
// Référence : https://pubmed.ncbi.nlm.nih.gov/15841682/

export const ASRS6_DATA = {
  id: 'asrs6',
  title: 'ASRS v1.1 — Dépistage',
  instructions: 'Pour chacune des questions suivantes, cochez la case qui décrit le mieux la façon dont vous vous êtes senti(e) et comporté(e) ces 6 derniers mois.',
  options: [
    { text: 'Jamais',      value: 0 },
    { text: 'Rarement',    value: 1 },
    { text: 'Parfois',     value: 2 },
    { text: 'Souvent',     value: 3 },
    { text: 'Très souvent', value: 4 },
  ],
  // 6 items de la Partie A de l'ASRS v1.1
  items: [
    'À quelle fréquence vous arrive-t-il de ne pas réussir à terminer les derniers détails d\'un projet, une fois que les parties les plus difficiles ont été faites ?',
    'À quelle fréquence vous arrive-t-il d\'avoir du mal à organiser votre travail lorsque vous avez une tâche qui requiert de l\'organisation ?',
    'À quelle fréquence avez-vous des difficultés à vous rappeler de vos rendez-vous ou de vos obligations ?',
    'Lorsque vous devez faire une tâche qui nécessite beaucoup de réflexion, à quelle fréquence évitez-vous ou différez-vous le début de cette tâche ?',
    'À quelle fréquence vous arrive-t-il de gigoter ou de bouger les mains ou les pieds lorsque vous devez rester assis longtemps ?',
    'À quelle fréquence vous arrive-t-il d\'être trop actif(ve) ou de faire des choses comme si vous étiez « monté(e) sur ressorts » ?',
  ] as string[],
} as const

// Calcule le score total (somme des 6 réponses, 0 à 24).
export function computeASRS6Score(answers: number[]): number {
  return answers.reduce((sum, a) => sum + (a ?? 0), 0)
}
