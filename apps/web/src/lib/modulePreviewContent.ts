/**
 * Contenu statique des modules thérapeutiques pour la prévisualisation praticien.
 * Source de vérité : reproduit fidèlement ce que voit le patient dans l'app mobile.
 * Toute modification de contenu côté mobile doit être répercutée ici.
 */

import type { ModuleType } from './database.types'

// ─── Convertisseur Markdown minimal ──────────────────────────────────────────
// Couvre les patterns utilisés dans les cartes : titres, gras, listes, <hr>

export function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // Bold + italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
    // Horizontal rule (avant les listes pour éviter conflit)
    .replace(/^---$/gm, '<hr />')
    // Listes non ordonnées (bullet * ou -)
    .replace(/^[*\-] (.+)$/gm, '<li>$1</li>')
    // Listes numérotées
    .replace(/^\d+\. (.+)$/gm, '<li>$2</li>')

  // Enrober les séquences de <li> dans des <ul>
  html = html.replace(/((?:<li>[\s\S]*?<\/li>\n?)+)/g, '<ul>$1</ul>')

  // Paragraphes : double saut de ligne → séparation
  const blocks = html.split(/\n\n+/)
  html = blocks
    .map(block => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (/^<(h[234]|ul|hr|li)/.test(trimmed)) return trimmed
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`
    })
    .filter(Boolean)
    .join('\n')

  return html
}

// ─── Types de prévisualisation ────────────────────────────────────────────────

export interface PreviewStep {
  number: number
  title: string
  hint: string
  color: string
}

export interface PreviewField {
  icon: string
  label: string
  detail?: string
}

export interface PreviewQuadrant {
  title: string
  subtitle: string
  color: string
}

export interface PreviewCard {
  id: string
  title: string
  summary: string
  content: string // Markdown
}

export type ModulePreview =
  | { kind: 'steps'; steps: PreviewStep[]; footer?: string }
  | { kind: 'fields'; fields: PreviewField[]; footer?: string }
  | { kind: 'grid2x2'; quadrants: PreviewQuadrant[]; footer?: string }
  | { kind: 'cards'; cards: PreviewCard[] }
  | { kind: 'coming_soon' }

// ─── Plan de Crise ────────────────────────────────────────────────────────────
// Source : apps/mobile/src/screens/modules/CrisisPlanScreen.tsx (STEPS)

const CRISIS_PLAN_PREVIEW: ModulePreview = {
  kind: 'steps',
  footer: 'Boutons d\'urgence permanents en bas d\'écran : 15 — SAMU | 3114 — Prévention du suicide',
  steps: [
    { number: 1, title: 'Signes avant-coureurs', hint: 'Comment est-ce que je me sens quand une crise approche ?', color: '#D97706' },
    { number: 2, title: 'Stratégies d\'apaisement internes', hint: 'Que puis-je faire seul(e) pour me calmer ?', color: '#059669' },
    { number: 3, title: 'Personnes ou lieux de distraction', hint: 'Qui puis-je voir ou où puis-je aller pour me distraire ?', color: '#4F46E5' },
    { number: 4, title: 'Proches à contacter', hint: 'Qui peut m\'écouter et m\'aider si je me sens en danger ?', color: '#9333EA' },
    { number: 5, title: 'Professionnels et urgences', hint: 'Quels professionnels ou services puis-je contacter ?', color: '#1D4ED8' },
    { number: 6, title: 'Sécuriser mon environnement', hint: 'Comment rendre mon entourage plus sûr ?', color: '#15803D' },
  ],
}

// ─── Agenda du Sommeil ────────────────────────────────────────────────────────
// Source : apps/mobile/src/screens/modules/SleepDiaryEntryScreen.tsx

const SLEEP_DIARY_PREVIEW: ModulePreview = {
  kind: 'fields',
  footer: 'Formule TCC-I (Morin, 1993) — SE (%) = Temps de sommeil effectif ÷ Temps passé au lit × 100. Le temps de sommeil effectif = durée au lit − latence d\'endormissement − durée totale des réveils nocturnes. Seuils de référence clinique : ≥ 85 % · 70–84 % · < 70 %.',
  fields: [
    { icon: '🌙', label: 'Heure de coucher', detail: 'Sélecteur horaire' },
    { icon: '☀️', label: 'Heure de lever', detail: 'Sélecteur horaire' },
    { icon: '⏱️', label: 'Temps pour s\'endormir', detail: 'Curseur en minutes (0–120)' },
    { icon: '🔔', label: 'Nombre de réveils nocturnes', detail: 'Curseur (0–10)' },
    { icon: '⏳', label: 'Durée totale des réveils', detail: 'Curseur en minutes (0–120)' },
    { icon: '⭐', label: 'Qualité du sommeil', detail: 'Échelle 1 à 5 étoiles' },
    { icon: '😨', label: 'Cauchemars', detail: 'Oui / Non' },
    { icon: '📝', label: 'Notes libres', detail: 'Champ texte optionnel' },
  ],
}

// ─── Balance Décisionnelle ────────────────────────────────────────────────────
// Source : apps/mobile/src/screens/modules/DecisionalBalanceScreen.tsx (QUADRANTS)

const DECISIONAL_BALANCE_PREVIEW: ModulePreview = {
  kind: 'grid2x2',
  footer: 'Chaque argument est pondéré de 1 à 5 étoiles (importance). Jauge de motivation dynamique : compare le score Changement vs Statu Quo.',
  quadrants: [
    { title: 'Avantages du changement', subtitle: 'Raisons de changer', color: '#059669' },
    { title: 'Inconvénients du changement', subtitle: 'Coûts du changement', color: '#EA580C' },
    { title: 'Avantages du statu quo', subtitle: 'Raisons de rester', color: '#2563EB' },
    { title: 'Inconvénients du statu quo', subtitle: 'Coûts de rester', color: '#9333EA' },
  ],
}

// ─── Thermomètre de l'Humeur ──────────────────────────────────────────────────
// Source : CANMAT 2018 / Basco & Rush (2005) / NIMH Life Chart Method.
// 3 dimensions quotidiennes : humeur, énergie, anxiété — échelle 1–10.

const MOOD_TRACKER_PREVIEW: ModulePreview = {
  kind: 'fields',
  footer: 'Saisie quotidienne unique. Historique consultable avec mini-graphiques par dimension (30 derniers jours). Données stockées localement sur l\'appareil.',
  fields: [
    { icon: '😊', label: 'Humeur', detail: 'Échelle 1–10' },
    { icon: '⚡', label: 'Énergie', detail: 'Échelle 1–10' },
    { icon: '💓', label: 'Anxiété', detail: 'Échelle 1–10' },
    { icon: '🌿', label: 'Plaisir', detail: 'Échelle 1–10 — dimension anhédonique (SHAPS 1995)' },
    { icon: '📝', label: 'Notes libres', detail: 'Champ texte optionnel' },
  ],
}

// ─── Colonnes de Beck ─────────────────────────────────────────────────────────
// Source : Beck, Rush, Shaw & Emery (1979). Cognitive Therapy of Depression.
// Version 5 colonnes (DTR standard) — outil central de la TCC.

const BECK_COLUMNS_PREVIEW: ModulePreview = {
  kind: 'steps',
  footer: 'Chaque enregistrement est stocké localement sur l\'appareil du patient. L\'historique est accessible à tout moment.',
  steps: [
    {
      number: 1,
      title: 'Situation',
      hint: 'Où étais-je ? Que se passait-il ? Qui était présent ?',
      color: '#0EA5E9',
    },
    {
      number: 2,
      title: 'Émotion(s)',
      hint: 'Quelle émotion ai-je ressentie ? Quelle était son intensité (0–100) ?',
      color: '#8B5CF6',
    },
    {
      number: 3,
      title: 'Pensée automatique',
      hint: 'Quelle pensée est passée dans ma tête ? À quel point y croyais-je (0–100) ?',
      color: '#EF4444',
    },
    {
      number: 4,
      title: 'Réponse rationnelle',
      hint: 'Quelle autre façon de voir la situation ? Quels faits contredisent cette pensée ?',
      color: '#059669',
    },
    {
      number: 5,
      title: 'Résultat',
      hint: 'Quelle émotion maintenant ? Intensité (0–100) ? Conviction en la pensée alternative (0–100) ?',
      color: '#D97706',
    },
  ],
}

// ─── Effets Secondaires Médicamenteux ────────────────────────────────────────
// Source : apps/mobile/src/screens/modules/MedicationSideEffectsScreen.tsx
// Inspiré UKU Side Effect Rating Scale (Lingjaerde et al., 1987)
// 6 effets — échelle 0–3 brute, sans interprétation algorithmique

const MEDICATION_SIDE_EFFECTS_PREVIEW: ModulePreview = {
  kind: 'fields',
  footer: 'Échelle inspirée de l\'UKU Side Effect Rating Scale (Lingjaerde et al., 1987). 0 = Absent · 1 = Léger · 2 = Modéré · 3 = Sévère. Valeurs brutes déclarées par le patient. Aucun seuil interprétatif — conformité MDR 2017/745. Historique des 30 derniers jours consultable dans l\'app.',
  fields: [
    { icon: '😴', label: 'Sédation', detail: 'Somnolence, lenteur, difficultés de concentration — échelle 0–3' },
    { icon: '🏃', label: 'Akathisie', detail: 'Agitation intérieure, impossibilité de rester immobile — échelle 0–3' },
    { icon: '🤝', label: 'Tremblements', detail: 'Mains, membres — lithium, valproate, antipsychotiques — échelle 0–3' },
    { icon: '💧', label: 'Sécheresse buccale', detail: 'Anticholinergiques, tricycliques — échelle 0–3' },
    { icon: '🌙', label: 'Troubles du sommeil', detail: 'Insomnie ou hypersomnie — ISRS, IRSN, stabilisateurs — échelle 0–3' },
    { icon: '🤢', label: 'Nausées / troubles digestifs', detail: 'Lithium, valproate, ISRS — échelle 0–3' },
    { icon: '📝', label: 'Notes libres', detail: 'Contexte, remarque, moment de la journée' },
  ],
}

// ─── Observance Médicamenteuse ────────────────────────────────────────────────
// Source : apps/mobile/src/screens/modules/MedicationAdherenceScreen.tsx
// Affichage neutre des 3 statuts déclarés par le patient. Aucune interprétation.

const MEDICATION_ADHERENCE_PREVIEW: ModulePreview = {
  kind: 'fields',
  footer: 'Données stockées localement sur le téléphone du patient. Le patient déclare lui-même son statut chaque jour — aucune interprétation algorithmique (conformité MDR 2017/745). L\'historique des 30 derniers jours est disponible dans l\'app.',
  fields: [
    { icon: '✅', label: 'Pris', detail: 'Traitement pris dans son intégralité' },
    { icon: '◑', label: 'Partiellement', detail: 'Traitement pris en partie (oubli, difficulté)' },
    { icon: '○', label: 'Non pris', detail: 'Traitement non pris ce jour' },
    { icon: '📝', label: 'Notes libres', detail: 'Champ texte optionnel (oubli, remarque…)' },
    { icon: '📅', label: 'Historique', detail: 'Liste brute des 30 derniers jours (date, statut, note)' },
  ],
}

// ─── Activation Comportementale ───────────────────────────────────────────────
// Source : apps/mobile/src/screens/modules/BehavioralActivationScreen.tsx
// Référence : Martell, Dimidjian & Herman-Dunn (2010). BATD-R (Lejuez et al., 2011).

const BEHAVIORAL_ACTIVATION_PREVIEW: ModulePreview = {
  kind: 'fields',
  footer: 'Le patient planifie et évalue ses activités selon deux dimensions (P et M). Données stockées localement. Aucun score global — les valeurs brutes P et M sont lues par le praticien en consultation pour guider l\'entretien motivationnel.',
  fields: [
    { icon: '📅', label: 'Date', detail: 'Date de l\'activité (passée ou à venir)' },
    { icon: '🏃', label: 'Nom de l\'activité', detail: 'Texte libre — ex : Marche 20 min, Appel à un ami' },
    { icon: '✅', label: 'Réalisée / Planifiée', detail: 'Le patient coche quand l\'activité est accomplie' },
    { icon: 'P', label: 'Plaisir (0–10)', detail: 'Satisfaction retirée de l\'activité — brut, sans interprétation' },
    { icon: 'M', label: 'Maîtrise (0–10)', detail: 'Sentiment d\'accomplissement — brut, sans interprétation' },
    { icon: '📝', label: 'Notes libres', detail: 'Contexte, ressenti, remarque' },
  ],
}

// ─── Thermomètre de la Peur ───────────────────────────────────────────────────
// Source : apps/mobile/src/screens/modules/FearEntryScreen.tsx
// Référence : Wolpe, J. (1969). The Practice of Behavior Therapy. SUDs scale.

const FEAR_THERMOMETER_PREVIEW: ModulePreview = {
  kind: 'fields',
  footer: 'Le patient mesure son niveau de détresse subjective (SUDs, Wolpe 1969) avant et après une stratégie de coping. Données stockées localement. Les valeurs brutes 0–100 sont lues par le praticien en consultation pour évaluer l\'efficacité des expositions et des stratégies.',
  fields: [
    { icon: '📍', label: 'Situation déclenchante', detail: 'Sélection dans le catalogue personnel ou texte libre' },
    { icon: '🌡️', label: 'SUDs avant (0–100)', detail: 'Niveau de détresse subjective avant la stratégie — chiffre brut, sans interprétation' },
    { icon: '🛠️', label: 'Stratégies utilisées', detail: 'Multi-sélection : Respiration lente, Ancrage 5-4-3-2-1, Exposition, etc. + texte libre' },
    { icon: '✅', label: 'SUDs après (0–100)', detail: 'Niveau de détresse après la stratégie — optionnel (remplissage différé possible)' },
    { icon: '📝', label: 'Notes libres', detail: 'Contexte, observations, remarque' },
  ],
}

// ─── Techniques de Respiration ────────────────────────────────────────────────
// Source : apps/mobile/src/constants/breathingTechniques.ts
// 5 techniques validées : cohérence cardiaque, diaphragmatique, carrée, 4-7-8, pleine conscience

const BREATHING_TECHNIQUES_PREVIEW: ModulePreview = {
  kind: 'fields',
  footer: 'Guide animé à rythme fixe — pas de biofeedback, aucun capteur. L\'historique des sessions (technique + durée) est consultable. Conformité MDR 2017/745 : aucune interprétation algorithmique.',
  fields: [
    { icon: '💙', label: 'Cohérence cardiaque', detail: 'Lehrer & Gevirtz (2014) — Grade B · 5s inspirez / 5s expirez · 5 min recommandées' },
    { icon: '🟢', label: 'Respiration diaphragmatique', detail: 'HAS, Conrad et al. (2007) — Grade B · 4s inspirez / 7s expirez · 5 min recommandées' },
    { icon: '🟠', label: 'Respiration carrée', detail: 'VA/DoD Guidelines — Grade C · 4-4-4-4 · 4 min recommandées' },
    { icon: '🟣', label: 'Technique 4-7-8', detail: 'Accord experts — Grade C · 4s-7s-8s · endormissement, crise anxieuse · 3 min' },
    { icon: '🔵', label: 'Pleine conscience respiratoire', detail: 'MBCT Segal et al. (2002) — Grade A rechute dépressive · 4-1-6-1 · 10 min recommandées' },
    { icon: '📅', label: 'Historique des sessions', detail: 'Technique utilisée + durée effective — données brutes, sans interprétation' },
  ],
}

// ─── Index général ────────────────────────────────────────────────────────────

export const MODULE_PREVIEW: Partial<Record<ModuleType, ModulePreview>> = {
  crisis_plan: CRISIS_PLAN_PREVIEW,
  sleep_diary: SLEEP_DIARY_PREVIEW,
  decisional_balance: DECISIONAL_BALANCE_PREVIEW,
  beck_columns: BECK_COLUMNS_PREVIEW,
  mood_tracker: MOOD_TRACKER_PREVIEW,
  medication_adherence: MEDICATION_ADHERENCE_PREVIEW,
  medication_side_effects: MEDICATION_SIDE_EFFECTS_PREVIEW,
  fear_thermometer: FEAR_THERMOMETER_PREVIEW,
  behavioral_activation: BEHAVIORAL_ACTIVATION_PREVIEW,
  breathing_techniques: BREATHING_TECHNIQUES_PREVIEW,
}

// ─── Mode Ado — couleurs et textes adaptés ────────────────────────────────────
// Source textes : apps/mobile/src/i18n/locales/fr/teen.json
// Source couleurs : apps/mobile/src/theme/teen.ts

export const TEEN_MODULE_COLORS: Record<string, string> = {
  crisis_plan:             '#FF4D6D',
  therapeutic_commitment:  '#FF4D6D',
  distress_tolerance:      '#FF4D6D',
  medication_side_effects: '#8B5CF6',
  medication_adherence:    '#8B5CF6',
  sleep_diary:             '#06B6D4',
  diet_weight_psycho:      '#06B6D4',
  chronobiology_tracker:   '#06B6D4',
  mood_tracker:            '#F97316',
  emotion_wheel:           '#F97316',
  behavioral_activation:   '#F97316',
  beck_columns:            '#10B981',
  cognitive_distortions:   '#10B981',
  grounding:               '#10B981',
  rim:                     '#10B981',
  fear_thermometer:        '#F59E0B',
  exposure_hierarchy:      '#F59E0B',
  breathing_techniques:    '#F59E0B',
  cognitive_saturation:    '#F59E0B',
  craving_journal:         '#EC4899',
  decisional_balance:      '#EC4899',
}

const TEEN_DEFAULT_COLOR = '#6366F1'

const CRISIS_PLAN_TEEN: ModulePreview = {
  kind: 'steps',
  footer: CRISIS_PLAN_PREVIEW.footer,
  steps: [
    { number: 1, title: 'Quand je sens que ça tourne mal',    hint: 'Comment est-ce que je me sens quand une crise approche ?', color: '#D97706' },
    { number: 2, title: 'Ce qui m\'aide à me calmer',         hint: 'Que puis-je faire seul(e) pour me calmer ?',               color: '#059669' },
    { number: 3, title: 'Ce qui me change les idées',         hint: 'Qui puis-je voir ou où puis-je aller pour me distraire ?', color: '#4F46E5' },
    { number: 4, title: 'À qui je peux parler',               hint: 'Qui peut m\'écouter et m\'aider si je me sens en danger ?', color: '#9333EA' },
    { number: 5, title: 'Mon équipe soignante',               hint: 'Quels professionnels ou services puis-je contacter ?',      color: '#1D4ED8' },
    { number: 6, title: 'Rendre mon espace plus sûr',         hint: 'Comment rendre mon entourage plus sûr ?',                  color: '#15803D' },
  ],
}

const BECK_COLUMNS_TEEN: ModulePreview = {
  kind: 'steps',
  footer: BECK_COLUMNS_PREVIEW.footer,
  steps: [
    { number: 1, title: 'Ce qui s\'est passé',         hint: 'Où j\'étais ? Qu\'est-ce qui se passait ? Qui était là ?',     color: '#0EA5E9' },
    { number: 2, title: 'Ce que j\'ai ressenti',       hint: 'Quelle émotion j\'ai ressentie ? Intensité (0–100) ?',         color: '#8B5CF6' },
    { number: 3, title: 'Ce que j\'ai pensé direct',   hint: 'Quelle pensée est passée dans ma tête ? J\'y croyais à (0–100) ?', color: '#EF4444' },
    { number: 4, title: 'Une autre façon de voir',     hint: 'Quelle autre façon de voir ? Quels faits contredisent cette pensée ?', color: '#059669' },
    { number: 5, title: 'Résultat',                    hint: 'Quelle émotion maintenant ? Intensité (0–100) ? Conviction (0–100) ?', color: '#D97706' },
  ],
}

const MOOD_TRACKER_TEEN: ModulePreview = {
  kind: 'fields',
  footer: MOOD_TRACKER_PREVIEW.footer,
  fields: [
    { icon: '😊', label: 'Humeur',            detail: 'Échelle 1–10' },
    { icon: '⚡', label: 'Énergie',           detail: 'Échelle 1–10' },
    { icon: '💓', label: 'Stress / Anxiété',  detail: 'Échelle 1–10' },
    { icon: '🌿', label: 'Plaisir',           detail: 'Échelle 1–10' },
    { icon: '📝', label: 'Notes libres',      detail: 'Champ texte optionnel' },
  ],
}

const DECISIONAL_BALANCE_TEEN: ModulePreview = {
  kind: 'grid2x2',
  footer: DECISIONAL_BALANCE_PREVIEW.footer,
  quadrants: [
    { title: 'Pourquoi changer serait bien',          subtitle: 'Raisons de changer',    color: '#059669' },
    { title: 'Ce que ça m\'coûterait de changer',     subtitle: 'Coûts du changement',   color: '#EA580C' },
    { title: 'Pourquoi rester comme je suis',         subtitle: 'Raisons de rester',     color: '#2563EB' },
    { title: 'Ce que ça me coûte de pas changer',     subtitle: 'Coûts de rester',       color: '#9333EA' },
  ],
}

const MODULE_PREVIEW_TEEN: Partial<Record<ModuleType, ModulePreview>> = {
  crisis_plan:         CRISIS_PLAN_TEEN,
  beck_columns:        BECK_COLUMNS_TEEN,
  mood_tracker:        MOOD_TRACKER_TEEN,
  decisional_balance:  DECISIONAL_BALANCE_TEEN,
}

export function getModulePreview(
  moduleType: ModuleType,
  isTeenMode: boolean,
): { preview: ModulePreview; accentColor: string } | null {
  const preview = isTeenMode
    ? (MODULE_PREVIEW_TEEN[moduleType] ?? MODULE_PREVIEW[moduleType])
    : MODULE_PREVIEW[moduleType]
  if (!preview) return null
  const accentColor = isTeenMode
    ? (TEEN_MODULE_COLORS[moduleType] ?? TEEN_DEFAULT_COLOR)
    : 'var(--color-primary)'
  return { preview, accentColor }
}
