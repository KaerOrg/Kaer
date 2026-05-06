// ASRS v1.1 — Adult ADHD Self-Report Scale, Bilan Complet (18 items, Parties A + B)
// Kessler RC et al. — The World Health Organization Adult ADHD Self-Report Scale (ASRS):
// a short screening scale for use in the general population. Psychol Med 2005;35(2):245-256.
// Traduction française officielle OMS. Auto-évaluation adulte (18+).
// ⚠️ Vérifier le libellé exact de chaque item contre le PDF officiel OMS avant mise en production.
// Référence : https://pubmed.ncbi.nlm.nih.gov/15841682/

export type ASRS18Part = 'part_a' | 'part_b'

export interface ASRS18Item {
  readonly question: string
  readonly part: ASRS18Part
}

export const ASRS18_PARTS: Record<ASRS18Part, { readonly label: string; readonly max: number }> = {
  part_a: { label: 'Partie A', max: 24 },
  part_b: { label: 'Partie B', max: 48 },
}

export const ASRS18_DATA = {
  id: 'asrs18',
  title: 'ASRS v1.1 — Bilan Complet',
  instructions: 'Pour chacune des questions suivantes, cochez la case qui décrit le mieux la façon dont vous vous êtes senti(e) et comporté(e) ces 6 derniers mois.',
  options: [
    { text: 'Jamais',       value: 0 },
    { text: 'Rarement',     value: 1 },
    { text: 'Parfois',      value: 2 },
    { text: 'Souvent',      value: 3 },
    { text: 'Très souvent', value: 4 },
  ],
  // 18 items : 6 Partie A + 12 Partie B
  items: [
    // ── Partie A (items 1–6) ─────────────────────────────────────────────────
    { question: 'À quelle fréquence vous arrive-t-il de ne pas réussir à terminer les derniers détails d\'un projet, une fois que les parties les plus difficiles ont été faites ?',                                                      part: 'part_a' as ASRS18Part },
    { question: 'À quelle fréquence vous arrive-t-il d\'avoir du mal à organiser votre travail lorsque vous avez une tâche qui requiert de l\'organisation ?',                                                                             part: 'part_a' as ASRS18Part },
    { question: 'À quelle fréquence avez-vous des difficultés à vous rappeler de vos rendez-vous ou de vos obligations ?',                                                                                                                 part: 'part_a' as ASRS18Part },
    { question: 'Lorsque vous devez faire une tâche qui nécessite beaucoup de réflexion, à quelle fréquence évitez-vous ou différez-vous le début de cette tâche ?',                                                                       part: 'part_a' as ASRS18Part },
    { question: 'À quelle fréquence vous arrive-t-il de gigoter ou de bouger les mains ou les pieds lorsque vous devez rester assis longtemps ?',                                                                                          part: 'part_a' as ASRS18Part },
    { question: 'À quelle fréquence vous arrive-t-il d\'être trop actif(ve) ou de faire des choses comme si vous étiez « monté(e) sur ressorts » ?',                                                                                       part: 'part_a' as ASRS18Part },
    // ── Partie B (items 7–18) ────────────────────────────────────────────────
    { question: 'À quelle fréquence vous arrive-t-il de faire des erreurs par étourderie lorsque vous avez à travailler sur un projet ennuyeux ou difficile ?',                                                                            part: 'part_b' as ASRS18Part },
    { question: 'À quelle fréquence vous arrive-t-il d\'avoir du mal à rester attentif(ve) lorsque vous effectuez un travail fastidieux ou répétitif ?',                                                                                   part: 'part_b' as ASRS18Part },
    { question: 'À quelle fréquence vous arrive-t-il d\'avoir du mal à vous concentrer sur ce que l\'on vous dit, même quand on s\'adresse directement à vous ?',                                                                          part: 'part_b' as ASRS18Part },
    { question: 'À quelle fréquence vous arrive-t-il d\'égarer ou de ne pas trouver des objets à votre domicile ou à votre lieu de travail ?',                                                                                             part: 'part_b' as ASRS18Part },
    { question: 'À quelle fréquence vous distrayez-vous en raison de ce qui se passe autour de vous ?',                                                                                                                                   part: 'part_b' as ASRS18Part },
    { question: 'À quelle fréquence vous arrive-t-il de quitter votre siège lors de réunions ou dans d\'autres situations où vous devriez rester assis(e) ?',                                                                              part: 'part_b' as ASRS18Part },
    { question: 'À quelle fréquence vous sentez-vous agité(e) ou remuant(e) ?',                                                                                                                                                           part: 'part_b' as ASRS18Part },
    { question: 'À quelle fréquence vous arrive-t-il d\'avoir des difficultés à vous défouler et à vous relaxer quand vous avez du temps libre ?',                                                                                         part: 'part_b' as ASRS18Part },
    { question: 'À quelle fréquence vous arrive-t-il de parler trop lorsque vous êtes avec d\'autres personnes ?',                                                                                                                         part: 'part_b' as ASRS18Part },
    { question: 'À quelle fréquence, lorsque vous participez à une conversation, vous arrive-t-il de finir les phrases de vos interlocuteurs avant qu\'ils aient pu le faire eux-mêmes ?',                                                  part: 'part_b' as ASRS18Part },
    { question: 'À quelle fréquence vous arrive-t-il d\'avoir du mal à attendre votre tour dans les situations où chacun doit attendre son tour ?',                                                                                        part: 'part_b' as ASRS18Part },
    { question: 'À quelle fréquence vous arrive-t-il d\'interrompre les autres lorsqu\'ils sont occupés ?',                                                                                                                                part: 'part_b' as ASRS18Part },
  ] as ASRS18Item[],
} as const

export interface ASRS18SubScores {
  part_a: number
  part_b: number
}

// Calcule les scores par partie (A : 0–24, B : 0–48) et le total (0–72).
export function computeASRS18SubScores(answers: number[]): ASRS18SubScores {
  const scores: ASRS18SubScores = { part_a: 0, part_b: 0 }
  ASRS18_DATA.items.forEach((item, i) => {
    scores[item.part] += answers[i] ?? 0
  })
  return scores
}
