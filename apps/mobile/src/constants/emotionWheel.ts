// ─── Roue des émotions ────────────────────────────────────────────────────────
//
// Basée sur le modèle de Plutchik (1980), Psychoevolutionary theory of emotion,
// adapté en français pour usage clinique (TCC, ACT, TCD).
// Référence : Plutchik R. (1980). Emotion: A Psychoevolutionary Synthesis.
// Harper & Row. Grade B — consensus clinique international.
//
// Structure à 3 niveaux : émotion primaire → secondaire → spécifique
// Aucun label interprétatif ni seuil de score (conformité MDR 2017/745).

export interface SpecificEmotion {
  key: string
  label: string
}

export interface SecondaryEmotion {
  key: string
  label: string
  specifics: readonly SpecificEmotion[]
}

export interface PrimaryEmotion {
  key: string
  label: string
  icon: string // MaterialCommunityIcons
  color: string
  secondaries: readonly SecondaryEmotion[]
}

export const EMOTION_WHEEL: readonly PrimaryEmotion[] = [
  {
    key: 'joy',
    label: 'Joie',
    icon: 'emoticon-happy-outline',
    color: '#F59E0B',
    secondaries: [
      {
        key: 'serenity',
        label: 'Sérénité',
        specifics: [
          { key: 'calm', label: 'Calme' },
          { key: 'peaceful', label: 'Paisible' },
          { key: 'content', label: 'Content(e)' },
        ],
      },
      {
        key: 'joy_2',
        label: 'Joie',
        specifics: [
          { key: 'happy', label: 'Heureux/se' },
          { key: 'cheerful', label: 'Enjoué(e)' },
          { key: 'amused', label: 'Amusé(e)' },
        ],
      },
      {
        key: 'ecstasy',
        label: 'Extase',
        specifics: [
          { key: 'elated', label: 'Exalté(e)' },
          { key: 'euphoric', label: 'Euphorique' },
          { key: 'overjoyed', label: 'Aux anges' },
        ],
      },
    ],
  },
  {
    key: 'trust',
    label: 'Confiance',
    icon: 'shield-heart-outline',
    color: '#10B981',
    secondaries: [
      {
        key: 'acceptance',
        label: 'Acceptation',
        specifics: [
          { key: 'open', label: 'Ouvert(e)' },
          { key: 'tolerant', label: 'Tolérant(e)' },
          { key: 'receptive', label: 'Réceptif/ve' },
        ],
      },
      {
        key: 'trust_2',
        label: 'Confiance',
        specifics: [
          { key: 'secure', label: 'En sécurité' },
          { key: 'confident', label: 'Confiant(e)' },
          { key: 'assured', label: 'Rassuré(e)' },
        ],
      },
      {
        key: 'admiration',
        label: 'Admiration',
        specifics: [
          { key: 'admiring', label: 'Admiratif/ve' },
          { key: 'grateful', label: 'Reconnaissant(e)' },
          { key: 'reverent', label: 'En respect' },
        ],
      },
    ],
  },
  {
    key: 'fear',
    label: 'Peur',
    icon: 'alert-circle-outline',
    color: '#6EE7B7',
    secondaries: [
      {
        key: 'apprehension',
        label: 'Appréhension',
        specifics: [
          { key: 'uneasy', label: 'Mal à l\'aise' },
          { key: 'worried', label: 'Inquiet/ète' },
          { key: 'nervous', label: 'Nerveux/se' },
        ],
      },
      {
        key: 'fear_2',
        label: 'Peur',
        specifics: [
          { key: 'scared', label: 'Effrayé(e)' },
          { key: 'anxious', label: 'Anxieux/se' },
          { key: 'threatened', label: 'Menacé(e)' },
        ],
      },
      {
        key: 'terror',
        label: 'Terreur',
        specifics: [
          { key: 'panicked', label: 'En panique' },
          { key: 'horrified', label: 'Horrifié(e)' },
          { key: 'overwhelmed', label: 'Submergé(e)' },
        ],
      },
    ],
  },
  {
    key: 'surprise',
    label: 'Surprise',
    icon: 'emoticon-excited-outline',
    color: '#06B6D4',
    secondaries: [
      {
        key: 'distraction',
        label: 'Distraction',
        specifics: [
          { key: 'confused', label: 'Confus(e)' },
          { key: 'uncertain', label: 'Incertain(e)' },
          { key: 'perplexed', label: 'Perplexe' },
        ],
      },
      {
        key: 'surprise_2',
        label: 'Surprise',
        specifics: [
          { key: 'surprised', label: 'Surpris(e)' },
          { key: 'startled', label: 'Saisi(e)' },
          { key: 'astonished', label: 'Étonné(e)' },
        ],
      },
      {
        key: 'amazement',
        label: 'Stupéfaction',
        specifics: [
          { key: 'amazed', label: 'Stupéfait(e)' },
          { key: 'awed', label: 'Émerveillé(e)' },
          { key: 'dumbfounded', label: 'Abasourdi(e)' },
        ],
      },
    ],
  },
  {
    key: 'sadness',
    label: 'Tristesse',
    icon: 'emoticon-sad-outline',
    color: '#3B82F6',
    secondaries: [
      {
        key: 'pensiveness',
        label: 'Mélancolie',
        specifics: [
          { key: 'pensive', label: 'Pensif/ve' },
          { key: 'nostalgic', label: 'Nostalgique' },
          { key: 'wistful', label: 'Mélancolique' },
        ],
      },
      {
        key: 'sadness_2',
        label: 'Tristesse',
        specifics: [
          { key: 'sad', label: 'Triste' },
          { key: 'sorrowful', label: 'Chagriné(e)' },
          { key: 'dejected', label: 'Abattu(e)' },
        ],
      },
      {
        key: 'grief',
        label: 'Désespoir',
        specifics: [
          { key: 'hopeless', label: 'Sans espoir' },
          { key: 'despairing', label: 'Désespéré(e)' },
          { key: 'anguished', label: 'Angoissé(e)' },
        ],
      },
    ],
  },
  {
    key: 'disgust',
    label: 'Dégoût',
    icon: 'emoticon-sick-outline',
    color: '#8B5CF6',
    secondaries: [
      {
        key: 'boredom',
        label: 'Ennui',
        specifics: [
          { key: 'bored', label: 'Ennuyé(e)' },
          { key: 'indifferent', label: 'Indifférent(e)' },
          { key: 'apathetic', label: 'Apathique' },
        ],
      },
      {
        key: 'disgust_2',
        label: 'Dégoût',
        specifics: [
          { key: 'disgusted', label: 'Dégoûté(e)' },
          { key: 'revolted', label: 'Révulsé(e)' },
          { key: 'repulsed', label: 'Repoussé(e)' },
        ],
      },
      {
        key: 'loathing',
        label: 'Aversion',
        specifics: [
          { key: 'loathing', label: 'Horreur' },
          { key: 'contemptuous', label: 'Mépris' },
          { key: 'hateful', label: 'Haine' },
        ],
      },
    ],
  },
  {
    key: 'anger',
    label: 'Colère',
    icon: 'emoticon-angry-outline',
    color: '#EF4444',
    secondaries: [
      {
        key: 'annoyance',
        label: 'Agacement',
        specifics: [
          { key: 'annoyed', label: 'Agacé(e)' },
          { key: 'irritated', label: 'Irrité(e)' },
          { key: 'impatient', label: 'Impatient(e)' },
        ],
      },
      {
        key: 'anger_2',
        label: 'Colère',
        specifics: [
          { key: 'angry', label: 'En colère' },
          { key: 'frustrated', label: 'Frustré(e)' },
          { key: 'resentful', label: 'Rancunier/ère' },
        ],
      },
      {
        key: 'rage',
        label: 'Rage',
        specifics: [
          { key: 'furious', label: 'Furieux/se' },
          { key: 'outraged', label: 'Outré(e)' },
          { key: 'enraged', label: 'Hors de soi' },
        ],
      },
    ],
  },
  {
    key: 'anticipation',
    label: 'Anticipation',
    icon: 'clock-fast',
    color: '#F97316',
    secondaries: [
      {
        key: 'interest',
        label: 'Intérêt',
        specifics: [
          { key: 'curious', label: 'Curieux/se' },
          { key: 'interested', label: 'Intéressé(e)' },
          { key: 'attentive', label: 'Attentif/ve' },
        ],
      },
      {
        key: 'anticipation_2',
        label: 'Anticipation',
        specifics: [
          { key: 'expectant', label: 'Dans l\'attente' },
          { key: 'hopeful', label: 'Plein(e) d\'espoir' },
          { key: 'eager', label: 'Impatient(e) positivement' },
        ],
      },
      {
        key: 'vigilance',
        label: 'Vigilance',
        specifics: [
          { key: 'alert', label: 'En alerte' },
          { key: 'cautious', label: 'Prudent(e)' },
          { key: 'watchful', label: 'Aux aguets' },
        ],
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPrimaryEmotion(key: string): PrimaryEmotion | undefined {
  return EMOTION_WHEEL.find((e) => e.key === key)
}

export function getSecondaryEmotion(
  primaryKey: string,
  secondaryKey: string
): SecondaryEmotion | undefined {
  return getPrimaryEmotion(primaryKey)?.secondaries.find((s) => s.key === secondaryKey)
}
