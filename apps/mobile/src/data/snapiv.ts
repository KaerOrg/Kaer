// SNAP-IV — Swanson, Nolan and Pelham Rating Scale, version IV
// Swanson JM et al. (2001) — Clinical relevance of the primary findings of the MTA
// 26 items (18 TDAH + 8 TOD) cotés 0-3 par un parent ou un enseignant
// Version francophone : traduction standard publiée par le CADDRA (2011)
// ⚠️ Vérifier le libellé exact de chaque item contre la version officielle CADDRA avant mise en production.
// ⚠️ Outil d'hétéro-évaluation : doit être complété par un parent, un tuteur ou un enseignant — PAS par l'enfant.

export type SNAPIVSubscale = 'inattention' | 'hyperactivite' | 'tod'

export interface SNAPIVItem {
  readonly question: string
  readonly subscale: SNAPIVSubscale
}

export const SNAPIV_SUBSCALES: Record<
  SNAPIVSubscale,
  { readonly label: string; readonly max: number }
> = {
  inattention:   { label: 'Inattention',              max: 27 },
  hyperactivite: { label: 'Hyperactivité-Impulsivité', max: 27 },
  tod:           { label: 'Opposition-Défiance',       max: 24 },
}

export const SNAPIV_DATA = {
  id: 'snap-iv',
  title: 'SNAP-IV',
  instructions: 'Pour chacun des comportements suivants, indiquez à quelle fréquence vous l\'observez chez l\'enfant.',
  options: [
    { text: 'Pas du tout', value: 0 },
    { text: 'Un peu',      value: 1 },
    { text: 'Assez souvent', value: 2 },
    { text: 'Beaucoup',    value: 3 },
  ],
  // 26 items : 9 Inattention + 9 Hyperactivité-Impulsivité + 8 TOD
  items: [
    // ── Inattention (I) ──────────────────────────────────────────────────────
    { question: 'Ne prête pas attention aux détails ou fait des erreurs d\'étourderie dans ses devoirs, au travail ou lors d\'autres activités.', subscale: 'inattention' as SNAPIVSubscale },
    { question: 'A du mal à soutenir son attention sur des tâches ou des activités de jeu.', subscale: 'inattention' as SNAPIVSubscale },
    { question: 'Semble ne pas écouter quand on lui parle directement.', subscale: 'inattention' as SNAPIVSubscale },
    { question: 'Ne suit pas les consignes jusqu\'au bout et n\'arrive pas à terminer ses devoirs ou ses tâches (sans que ce soit de l\'opposition ou un problème de compréhension).', subscale: 'inattention' as SNAPIVSubscale },
    { question: 'A du mal à organiser ses tâches et ses activités.', subscale: 'inattention' as SNAPIVSubscale },
    { question: 'Évite, a de l\'aversion ou fait à contrecœur les tâches qui demandent un effort mental soutenu.', subscale: 'inattention' as SNAPIVSubscale },
    { question: 'Perd les objets nécessaires à ses tâches ou activités (trousse, livres, matériel scolaire).', subscale: 'inattention' as SNAPIVSubscale },
    { question: 'Se laisse facilement distraire par des stimuli extérieurs.', subscale: 'inattention' as SNAPIVSubscale },
    { question: 'Est oublieux ou oublieuse dans les activités de la vie quotidienne.', subscale: 'inattention' as SNAPIVSubscale },
    // ── Hyperactivité-Impulsivité (HI) ───────────────────────────────────────
    { question: 'Agite les mains ou les pieds, ou se tortille sur son siège.', subscale: 'hyperactivite' as SNAPIVSubscale },
    { question: 'Quitte sa place dans des situations où il ou elle devrait rester assis(e).', subscale: 'hyperactivite' as SNAPIVSubscale },
    { question: 'Court ou grimpe dans des situations où cela est inapproprié.', subscale: 'hyperactivite' as SNAPIVSubscale },
    { question: 'A du mal à jouer ou à s\'occuper tranquillement à des activités de détente.', subscale: 'hyperactivite' as SNAPIVSubscale },
    { question: 'Est « sur la brèche » ou agit comme s\'il ou elle était « monté(e) sur ressorts ».', subscale: 'hyperactivite' as SNAPIVSubscale },
    { question: 'Parle excessivement.', subscale: 'hyperactivite' as SNAPIVSubscale },
    { question: 'Laisse échapper la réponse à une question qui n\'est pas encore entièrement posée.', subscale: 'hyperactivite' as SNAPIVSubscale },
    { question: 'A du mal à attendre son tour.', subscale: 'hyperactivite' as SNAPIVSubscale },
    { question: 'Interrompt les autres ou s\'impose (fait irruption dans les conversations ou dans les jeux des autres).', subscale: 'hyperactivite' as SNAPIVSubscale },
    // ── Trouble Oppositionnel avec Défiance (TOD) ─────────────────────────────
    { question: 'S\'emporte.', subscale: 'tod' as SNAPIVSubscale },
    { question: 'Se dispute avec des adultes.', subscale: 'tod' as SNAPIVSubscale },
    { question: 'S\'oppose activement ou refuse d\'obéir aux règles et aux demandes des adultes.', subscale: 'tod' as SNAPIVSubscale },
    { question: 'Embête délibérément les autres.', subscale: 'tod' as SNAPIVSubscale },
    { question: 'Fait porter à autrui la responsabilité de ses erreurs ou de ses mauvais comportements.', subscale: 'tod' as SNAPIVSubscale },
    { question: 'Est susceptible ou facilement agacé(e) par les autres.', subscale: 'tod' as SNAPIVSubscale },
    { question: 'Est souvent en colère et plein(e) de ressentiment.', subscale: 'tod' as SNAPIVSubscale },
    { question: 'Se montre rancunier(ière) ou vindicatif(ve).', subscale: 'tod' as SNAPIVSubscale },
  ] as SNAPIVItem[],
} as const

// Calcule les scores par sous-échelle à partir du tableau de 26 réponses (0-3).
export function computeSNAPIVSubscaleScores(
  answers: number[]
): Record<SNAPIVSubscale, number> {
  const scores: Record<SNAPIVSubscale, number> = { inattention: 0, hyperactivite: 0, tod: 0 }
  SNAPIV_DATA.items.forEach((item, i) => {
    scores[item.subscale] += answers[i] ?? 0
  })
  return scores
}
