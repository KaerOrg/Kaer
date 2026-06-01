import { SNAPIV_DATA } from '../data/snapiv'
import { ASRS18_DATA } from '../data/asrs18'

const RCADS_SUBSCALE_MAP = [
  'tag','tag','tag','tag','tag',
  'tp','tp','tp','tp',
  'ts','ts','ts','ts','ts',
  'ps','ps','ps','ps',
  'toc','toc',
  'td','td','td','td','td',
] as const

export interface ScaleScoringConfig {
  readonly formula: 'sum' | 'mean'
  readonly items_count: number
  readonly score_decimals: number
  /** i18n keys for subscale chips displayed in history (e.g. ['chip_i', 'chip_hi', 'chip_tod']) */
  readonly chips?: readonly string[]
  computeScore(answers: (number | null)[]): number
  computeSubscaleScores?(answers: (number | null)[]): Record<string, number>
}

const sum = (answers: (number | null)[]) =>
  answers.reduce<number>((acc, a) => acc + (a ?? 0), 0)

export const SCALE_SCORING: Readonly<Record<string, ScaleScoringConfig>> = {
  phq9: {
    formula: 'sum',
    items_count: 9,
    score_decimals: 0,
    computeScore: sum,
  },
  bsl23: {
    formula: 'mean',
    items_count: 23,
    score_decimals: 2,
    computeScore: (answers) =>
      parseFloat((sum(answers) / 23).toFixed(4)),
  },
  gad7: {
    formula: 'sum',
    items_count: 7,
    score_decimals: 0,
    computeScore: sum,
  },
  snap_iv: {
    formula: 'sum',
    items_count: 26,
    score_decimals: 0,
    chips: ['chip_i', 'chip_hi', 'chip_tod'],
    computeScore: sum,
    computeSubscaleScores: (answers) => {
      const scores: Record<string, number> = { inattention: 0, hyperactivite: 0, tod: 0 }
      SNAPIV_DATA.items.forEach((item, i) => {
        scores[item.subscale] += answers[i] ?? 0
      })
      return scores
    },
  },
  asrs6: {
    formula: 'sum',
    items_count: 6,
    score_decimals: 0,
    computeScore: sum,
  },
  asrs18: {
    formula: 'sum',
    items_count: 18,
    score_decimals: 0,
    chips: ['chip_a', 'chip_b'],
    computeScore: sum,
    computeSubscaleScores: (answers) => {
      const scores: Record<string, number> = { part_a: 0, part_b: 0 }
      ASRS18_DATA.items.forEach((item, i) => {
        scores[item.part] += answers[i] ?? 0
      })
      return scores
    },
  },
  rcads: {
    formula: 'sum',
    items_count: 25,
    score_decimals: 0,
    chips: ['chip_tag', 'chip_tp', 'chip_ts', 'chip_ps', 'chip_toc', 'chip_td'],
    computeScore: sum,
    computeSubscaleScores: (answers) => {
      const scores: Record<string, number> = { tag: 0, tp: 0, ts: 0, ps: 0, toc: 0, td: 0 }
      RCADS_SUBSCALE_MAP.forEach((subscale, i) => {
        scores[subscale] += answers[i] ?? 0
      })
      return scores
    },
  },
  nsi: {
    formula: 'sum',
    items_count: 9,
    score_decimals: 0,
    chips: ['chip_pct_recurrent'],
    computeScore: sum,
  },
  mood_tracker: {
    formula: 'mean',
    items_count: 6,
    score_decimals: 0,
    chips: ['chip_mood', 'chip_energy', 'chip_anxiety', 'chip_pleasure', 'chip_sleep', 'chip_food'],
    computeScore: (answers) => {
      const valid = answers.filter(a => a != null && !isNaN(a))
      if (valid.length === 0) return 0
      return Math.round(valid.reduce<number>((s, a) => s + a, 0) / valid.length)
    },
    computeSubscaleScores: (answers) => ({
      mood:     answers[0] ?? 0,
      energy:   answers[1] ?? 0,
      anxiety:  answers[2] ?? 0,
      pleasure: answers[3] ?? 0,
      sleep:    answers[4] ?? 0,
      food:     answers[5] ?? 0,
    }),
  },
  epds: {
    formula: 'sum',
    items_count: 10,
    score_decimals: 0,
    computeScore: sum,
  },
  medication_side_effects: {
    formula: 'sum',
    items_count: 6,
    score_decimals: 0,
    chips: ['chip_sedation', 'chip_akathisia', 'chip_tremors', 'chip_dry_mouth', 'chip_sleep', 'chip_nausea'],
    computeScore: sum,
    computeSubscaleScores: (answers) => ({
      sedation:  answers[0] ?? 0,
      akathisia: answers[1] ?? 0,
      tremors:   answers[2] ?? 0,
      dry_mouth: answers[3] ?? 0,
      sleep:     answers[4] ?? 0,
      nausea:    answers[5] ?? 0,
    }),
  },
}
