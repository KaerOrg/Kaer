export interface NSIItem {
  readonly text: string
  readonly options: readonly { readonly text: string; readonly value: number }[]
  readonly anchors?: { readonly left: string; readonly right: string }
}

const FREQ_OPTIONS = [
  { text: '≤1×/mois',  value: 0 },
  { text: '>1×/mois',  value: 1 },
  { text: '1×/sem.',   value: 2 },
  { text: '>1×/sem.',  value: 3 },
  { text: '1×/nuit',  value: 4 },
  { text: '>1×/nuit', value: 5 },
] as const

const NUM_OPTIONS = [
  { text: '0', value: 0 },
  { text: '1', value: 1 },
  { text: '2', value: 2 },
  { text: '3', value: 3 },
  { text: '4', value: 4 },
  { text: '5', value: 5 },
] as const

export const NSI_ITEMS: readonly NSIItem[] = [
  {
    text: "La fréquence à laquelle vos mauvais rêves vous réveillent\n(Définition : les cauchemars sont des mauvais rêves qui ont pour conséquence le réveil)",
    options: FREQ_OPTIONS,
  },
  {
    text: "L'intensité émotionnelle de vos cauchemars",
    options: NUM_OPTIONS,
    anchors: { left: 'Très faible', right: 'Très forte' },
  },
  {
    text: "La fréquence à laquelle vos cauchemars impliquent des menaces vitales sur la sécurité ou l'intégrité physique",
    options: FREQ_OPTIONS,
  },
  {
    text: "La façon dont vos cauchemars perturbent votre fonctionnement global en journée",
    options: NUM_OPTIONS,
    anchors: { left: 'Aucun impact', right: 'Très perturbants' },
  },
  {
    text: "La façon dont vos cauchemars perturbent votre humeur en journée",
    options: NUM_OPTIONS,
    anchors: { left: 'Aucun impact', right: 'Très perturbants' },
  },
  {
    text: "La façon dont vos cauchemars perturbent votre concentration et mémoire en journée",
    options: NUM_OPTIONS,
    anchors: { left: 'Aucun impact', right: 'Très perturbants' },
  },
  {
    text: "La façon dont vos cauchemars impactent votre capacité d'éveil (somnolence) en journée",
    options: NUM_OPTIONS,
    anchors: { left: 'Aucun impact', right: 'Très perturbants' },
  },
  {
    text: "La façon dont vos cauchemars perturbent votre endormissement",
    options: NUM_OPTIONS,
    anchors: { left: 'Aucun impact', right: 'Très perturbant' },
  },
  {
    text: "La façon dont vos cauchemars perturbent la continuité de votre sommeil",
    options: NUM_OPTIONS,
    anchors: { left: 'Aucun impact', right: 'Très perturbant' },
  },
]

export const NSI_DATA = {
  id: 'nsi',
  title: 'NSI — Index de sévérité des cauchemars',
  instructions: 'Pour chacune des questions, veuillez encercler le chiffre correspondant à votre réponse (dernier mois) :',
  items: NSI_ITEMS,
} as const

export function computeNSIScore(answers: (number | null)[]): number {
  return answers.reduce<number>((sum, a) => sum + (a ?? 0), 0)
}
