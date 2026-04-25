export interface EPDSItem {
  readonly text: string
  readonly options: readonly { readonly text: string; readonly value: number }[]
}

export const EPDS_ITEMS: readonly EPDSItem[] = [
  {
    text: "j'ai pu rire et prendre les choses du bon côté",
    options: [
      { text: "Aussi souvent que d'habitude", value: 0 },
      { text: 'Pas tout à fait autant', value: 1 },
      { text: 'Vraiment beaucoup moins souvent ces jours-ci', value: 2 },
      { text: 'Absolument pas', value: 3 },
    ],
  },
  {
    text: "je me suis sentie confiante et joyeuse, en pensant à l'avenir",
    options: [
      { text: "Autant que d'habitude", value: 0 },
      { text: "Plutôt moins que d'habitude", value: 1 },
      { text: "Vraiment moins que d'habitude", value: 2 },
      { text: 'Pratiquement pas', value: 3 },
    ],
  },
  {
    text: "je me suis reprochée, sans raisons, d'être responsable quand les choses allaient mal",
    options: [
      { text: 'Oui, la plupart du temps', value: 3 },
      { text: 'Oui, parfois', value: 2 },
      { text: 'Pas très souvent', value: 1 },
      { text: 'Non, jamais', value: 0 },
    ],
  },
  {
    text: 'je me suis sentie inquiète ou soucieuse sans motifs',
    options: [
      { text: 'Non, pas du tout', value: 0 },
      { text: 'Presque jamais', value: 1 },
      { text: 'Oui, parfois', value: 2 },
      { text: 'Oui, très souvent', value: 3 },
    ],
  },
  {
    text: 'je me suis sentie effrayée ou paniquée sans vraiment de raisons',
    options: [
      { text: 'Oui, vraiment souvent', value: 3 },
      { text: 'Oui, parfois', value: 2 },
      { text: 'Non, pas très souvent', value: 1 },
      { text: 'Non, pas du tout', value: 0 },
    ],
  },
  {
    text: "j'ai eu tendance à me sentir dépassée par les évènements",
    options: [
      { text: 'Oui, la plupart du temps, je me suis sentie incapable de faire face aux situations', value: 3 },
      { text: "Oui, parfois, je ne me suis pas sentie aussi capable de faire face que d'habitude", value: 2 },
      { text: "Non, j'ai pu faire face à la plupart des situations", value: 1 },
      { text: "Non, je me suis sentie aussi efficace que d'habitude", value: 0 },
    ],
  },
  {
    text: "je me suis sentie si malheureuse que j'ai eu des problèmes de sommeil",
    options: [
      { text: 'Oui, la plupart du temps', value: 3 },
      { text: 'Oui, parfois', value: 2 },
      { text: 'Pas très souvent', value: 1 },
      { text: 'Non, pas du tout', value: 0 },
    ],
  },
  {
    text: 'je me suis sentie triste ou peu heureuse',
    options: [
      { text: 'Oui, la plupart du temps', value: 3 },
      { text: 'Oui, très souvent', value: 2 },
      { text: 'Pas très souvent', value: 1 },
      { text: 'Non, pas du tout', value: 0 },
    ],
  },
  {
    text: "je me suis sentie si malheureuse que j'en ai pleuré",
    options: [
      { text: 'Oui, la plupart du temps', value: 3 },
      { text: 'Oui, très souvent', value: 2 },
      { text: 'Seulement de temps en temps', value: 1 },
      { text: 'Non, jamais', value: 0 },
    ],
  },
  {
    text: "il m'est arrivé de penser à me faire du mal",
    options: [
      { text: 'Oui, très souvent', value: 3 },
      { text: 'Parfois', value: 2 },
      { text: 'Presque jamais', value: 1 },
      { text: 'Jamais', value: 0 },
    ],
  },
]

export const EPDS_DATA = {
  id: 'epds',
  title: 'EPDS — Dépression périnatale',
  instructions: "Vous venez d'avoir un bébé. Nous aimerions savoir comment vous vous sentez. Veuillez souligner la réponse qui vous semble le mieux décrire comment vous vous êtes sentie durant la semaine passée (c'est-à-dire sur les 7 jours qui viennent de s'écouler).",
  periodPrefix: "Pendant la semaine qui vient de s'écouler…",
  items: EPDS_ITEMS,
} as const

export function computeEPDSScore(answers: (number | null)[]): number {
  return answers.reduce<number>((sum, a) => sum + (a ?? 0), 0)
}
