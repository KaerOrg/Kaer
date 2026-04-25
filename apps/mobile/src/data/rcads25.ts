// RCADS-25 — Revised Children's Anxiety and Depression Scale (forme courte, 25 items)
// Chorpita et al. (2000) ; forme courte : Ebesutani et al. (2012)
// Version francophone enfants — PQPTM (CIUSSS Capitale-Nationale)
// Source officielle : https://www.ciusss-capitalenationale.gouv.qc.ca
// ⚠️ Vérifier le libellé exact de chaque item contre le PDF officiel avant mise en production.

export type RCADSSubscale = 'tag' | 'tp' | 'ts' | 'ps' | 'toc' | 'td'

export interface RCADSItem {
  readonly question: string
  readonly subscale: RCADSSubscale
}

export const RCADS25_SUBSCALES: Record<
  RCADSSubscale,
  { readonly label: string; readonly max: number }
> = {
  tag: { label: 'Anxiété généralisée', max: 15 },
  tp:  { label: 'Trouble panique',     max: 12 },
  ts:  { label: 'Séparation',          max: 15 },
  ps:  { label: 'Phobie sociale',      max: 12 },
  toc: { label: 'TOC',                 max: 6  },
  td:  { label: 'Dépression',          max: 15 },
}

export const RCADS25_DATA = {
  id: 'rcads-25',
  title: 'RCADS-25',
  instructions: 'Pour chacune des affirmations suivantes, indique à quelle fréquence cela se passe pour toi.',
  options: [
    { text: 'Jamais',   value: 0 },
    { text: 'Parfois',  value: 1 },
    { text: 'Souvent',  value: 2 },
    { text: 'Toujours', value: 3 },
  ],
  // 25 items : 5 TAG + 4 TP + 5 TS + 4 PS + 2 TOC + 5 TD
  items: [
    // ── Anxiété Généralisée (TAG) ──────────────────────────────────────────────
    { question: 'Je m\'inquiète quand je crois avoir mal fait quelque chose.',                                                     subscale: 'tag' as RCADSSubscale },
    { question: 'Je pense que quelque chose de terrible va m\'arriver.',                                                          subscale: 'tag' as RCADSSubscale },
    { question: 'Je me tracasse à l\'idée de ne pas être aussi bon(ne) que les autres enfants.',                                  subscale: 'tag' as RCADSSubscale },
    { question: 'Je me fais du souci pour plein de choses.',                                                                      subscale: 'tag' as RCADSSubscale },
    { question: 'J\'ai peur d\'aller à l\'école.',                                                                               subscale: 'tag' as RCADSSubscale },
    // ── Trouble Panique (TP) ──────────────────────────────────────────────────
    { question: 'Soudainement, j\'ai du mal à respirer et mon cœur bat très vite, sans raison.',                                 subscale: 'tp'  as RCADSSubscale },
    { question: 'Je tremble ou j\'ai des frissons.',                                                                              subscale: 'tp'  as RCADSSubscale },
    { question: 'Je me sens étourdi(e) ou comme si j\'allais m\'évanouir.',                                                       subscale: 'tp'  as RCADSSubscale },
    { question: 'Soudainement, je me sens vraiment effrayé(e) sans aucune raison.',                                               subscale: 'tp'  as RCADSSubscale },
    // ── Anxiété de Séparation (TS) ────────────────────────────────────────────
    { question: 'Je ne veux pas rester seul(e) à la maison.',                                                                     subscale: 'ts'  as RCADSSubscale },
    { question: 'J\'ai peur si je dois dormir ailleurs que chez moi.',                                                            subscale: 'ts'  as RCADSSubscale },
    { question: 'Je m\'inquiète quand quelqu\'un de ma famille est en retard.',                                                   subscale: 'ts'  as RCADSSubscale },
    { question: 'Je ne veux pas aller à l\'école parce que mes parents vont me manquer.',                                         subscale: 'ts'  as RCADSSubscale },
    { question: 'Je pense que quelque chose de terrible va arriver à quelqu\'un de ma famille.',                                  subscale: 'ts'  as RCADSSubscale },
    // ── Phobie Sociale (PS) ───────────────────────────────────────────────────
    { question: 'Je suis nerveux(se) quand je dois parler devant la classe.',                                                      subscale: 'ps'  as RCADSSubscale },
    { question: 'J\'ai peur de faire quelque chose de stupide ou d\'embarrassant devant les autres.',                             subscale: 'ps'  as RCADSSubscale },
    { question: 'Je m\'inquiète de ce que les autres pensent de moi.',                                                            subscale: 'ps'  as RCADSSubscale },
    { question: 'J\'ai peur d\'être devant les gens.',                                                                            subscale: 'ps'  as RCADSSubscale },
    // ── TOC ───────────────────────────────────────────────────────────────────
    { question: 'Des images ou des pensées déplaisantes s\'imposent à moi et je n\'arrive pas à les chasser de mon esprit.',      subscale: 'toc' as RCADSSubscale },
    { question: 'Je dois faire certaines choses encore et encore (me laver les mains, remettre les objets en ordre…) pour éviter qu\'il arrive quelque chose de mauvais.', subscale: 'toc' as RCADSSubscale },
    // ── Dépression (TD) ───────────────────────────────────────────────────────
    { question: 'Je ne ressens pas beaucoup de plaisir à faire quoi que ce soit.',                                                 subscale: 'td'  as RCADSSubscale },
    { question: 'Je suis triste ou vide.',                                                                                         subscale: 'td'  as RCADSSubscale },
    { question: 'Je me sens fatigué(e) ou sans énergie.',                                                                         subscale: 'td'  as RCADSSubscale },
    { question: 'Je me sens sans valeur.',                                                                                         subscale: 'td'  as RCADSSubscale },
    { question: 'Je n\'ai plus envie de faire les choses que j\'aimais avant.',                                                   subscale: 'td'  as RCADSSubscale },
  ] as RCADSItem[],
} as const

// Calcule les scores par sous-échelle à partir du tableau de 25 réponses (0-3).
export function computeSubscaleScores(
  answers: number[]
): Record<RCADSSubscale, number> {
  const scores: Record<RCADSSubscale, number> = { tag: 0, tp: 0, ts: 0, ps: 0, toc: 0, td: 0 }
  RCADS25_DATA.items.forEach((item, i) => {
    scores[item.subscale] += answers[i] ?? 0
  })
  return scores
}
