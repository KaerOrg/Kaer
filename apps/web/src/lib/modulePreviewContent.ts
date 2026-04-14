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

// ─── Psychoéducation ─────────────────────────────────────────────────────────
// Source : apps/mobile/src/constants/psychoeducationCards.ts
// Le praticien voit le contenu complet (markdown) de chaque carte disponible.

const PSYCHO_CARDS_PREVIEW: ModulePreview = {
  kind: 'cards',
  cards: [
    {
      id: 'card_sleep_01',
      title: "Règles d'hygiène du sommeil",
      summary: '10 conseils pour améliorer la qualité de votre sommeil',
      content: `## Règles d'hygiène du sommeil

Un sommeil de qualité repose sur des habitudes régulières. Voici les principes fondamentaux à appliquer progressivement.

### 1. Horaires réguliers

Couchez-vous et levez-vous **à la même heure** tous les jours, même le week-end. La régularité est le pilier le plus important.

### 2. Lumière et obscurité

- Le matin, **exposez-vous à la lumière naturelle** dans les 30 minutes après le réveil.
- Le soir, **réduisez les lumières** 1 à 2 heures avant de dormir.
- Évitez les écrans (téléphone, tablette, ordinateur) dans les 30 minutes précédant le coucher.

### 3. Température

La température idéale pour dormir est entre **16 °C et 18 °C**. Un corps frais favorise l'endormissement.

### 4. Alimentation et stimulants

- Évitez la **caféine** après 14h (café, thé, sodas).
- Évitez l'**alcool** : il perturbe les cycles du sommeil profond.
- Ne mangez pas de repas copieux dans les 2 heures précédant le coucher.

### 5. Activité physique

L'activité physique régulière améliore le sommeil — mais évitez le sport intense dans les **3 heures avant le coucher**.

### 6. Le lit = sommeil

Utilisez votre lit uniquement pour dormir. Évitez d'y travailler ou de regarder des écrans.

### 7. Rituel du coucher

Créez un rituel apaisant : lecture, respiration lente, étirements doux... Ce signal conditionne votre cerveau à s'endormir.

### 8. Si vous ne dormez pas

Si vous n'êtes pas endormi(e) après 20 minutes, **levez-vous**. Faites une activité calme dans une pièce peu éclairée, puis revenez au lit quand la somnolence revient.

### 9. Sieste

Si vous faites la sieste, limitez-la à **20 minutes** avant 14h. Une sieste longue ou tardive perturbe le sommeil nocturne.

### 10. Agenda du sommeil

Utiliser l'agenda du sommeil de l'application vous permet de repérer vos rythmes et d'ajuster vos habitudes progressivement.

---

*Ces règles ne remplacent pas l'avis de votre praticien. Parlez-lui de vos difficultés de sommeil.*`,
    },
    {
      id: 'card_grounding_01',
      title: "Technique d'ancrage 5-4-3-2-1",
      summary: "Revenir au moment présent en cas d'anxiété ou de dissociation",
      content: `## Technique d'ancrage 5-4-3-2-1

C'est un **frein d'urgence** pour le cerveau. Cette technique utilise vos **cinq sens** pour forcer votre système nerveux à revenir dans l'instant présent. Elle est particulièrement utile en cas d'anxiété intense, de flashback ou de dissociation.

### Quand l'utiliser ?

- Lors d'une montée d'angoisse
- Quand vos pensées s'emballent
- Lors d'un flashback ou d'une dissociation
- Pour vous recentrer avant un moment stressant

---

### Comment pratiquer

**Prenez une profonde inspiration.** Puis parcourez chaque sens :

#### 5 choses que vous voyez

Regardez autour de vous et nommez mentalement (ou à voix haute) 5 éléments.

#### 4 choses que vous touchez

Portez attention aux textures et sensations physiques.

#### 3 choses que vous entendez

Fermez les yeux et identifiez 3 sons.

#### 2 choses que vous sentez

Identifiez deux odeurs, même subtiles.

#### 1 chose que vous goûtez

Notez le goût présent dans votre bouche.

---

**Prenez à nouveau une grande inspiration.** Si l'angoisse est toujours là, recommencez le cycle avec d'autres objets.

### À retenir

- Prenez votre temps à chaque étape.
- Il n'y a pas de "bonne" réponse — l'important est de **focaliser votre attention**.
- Cette technique demande un peu de pratique. Entraînez-vous **avant** les moments de crise.

---

*Partagez votre expérience avec cette technique à votre praticien lors de votre prochain rendez-vous.*`,
    },
    {
      id: 'card_cbt_01',
      title: 'Identifier les distorsions cognitives',
      summary: 'Reconnaître les pièges de la pensée automatique',
      content: `## Identifier les distorsions cognitives

Les **distorsions cognitives** sont des façons automatiques et déformées d'interpréter la réalité. Les reconnaître est la première étape pour les modifier.

### Les 10 distorsions les plus courantes

#### 1. La pensée tout-ou-rien
Vous voyez les choses de façon extrême, sans nuance.
*"Si je ne réussis pas parfaitement, je suis un(e) raté(e)."*

#### 2. La surgénéralisation
Un événement négatif devient une règle universelle.
*"J'ai échoué une fois → j'échoue toujours."*

#### 3. Le filtre mental
Vous ne voyez que les aspects négatifs d'une situation.
*"La soirée s'est bien passée, mais j'ai dit quelque chose de maladroit → la soirée était nulle."*

#### 4. La disqualification du positif
Les expériences positives "ne comptent pas".

#### 5. La lecture de pensée
Vous supposez savoir ce que les autres pensent.

#### 6. La prédiction négative
Vous anticipez que les choses vont mal se passer.

#### 7. La catastrophisation
Vous exagérez l'importance d'un problème.

#### 8. Le raisonnement émotionnel
*"Je me sens incompétent(e) → donc je suis incompétent(e)."*

#### 9. Les "il faut / je dois"
Des règles rigides et exigeantes envers vous-même ou les autres.

#### 10. L'étiquetage
*"J'ai fait une erreur → je suis nul(le)."*

---

### Comment les utiliser ?

1. Quelle pensée automatique est apparue ?
2. Cette pensée correspond-elle à une distorsion ?
3. Quelle serait une façon plus réaliste de voir la situation ?

---

*Votre praticien peut vous accompagner dans ce travail, notamment avec les Colonnes de Beck.*`,
    },
    {
      id: 'card_medication_appetite_01',
      title: 'Traitements et Appétit : Reprendre le contrôle',
      summary: 'Comprendre et gérer la faim liée aux traitements',
      content: `## Traitements et Appétit : Reprendre le contrôle

Certains traitements (comme les antipsychotiques ou les thymorégulateurs) peuvent modifier votre métabolisme et bloquer le signal de satiété envoyé à votre cerveau. **Vous n'êtes pas coupable d'avoir faim, c'est un effet biologique du traitement.**

Voici des stratégies comportementales pour limiter la prise de poids sans faire de régime restrictif :

- **La règle des 20 minutes :** Le cerveau met 20 minutes à comprendre que l'estomac est plein. Mangez lentement, posez votre fourchette entre chaque bouchée.
- **Volume et Fibres :** Augmentez le volume de votre repas avec des légumes verts ou des aliments riches en fibres.
- **Le piège de la soif :** Les traitements assèchent la bouche. On confond souvent cette soif avec une envie de sucre. Buvez un grand verre d'eau avant chaque grignotage et attendez 10 minutes.
- **Mouvement doux :** Une marche de 15 minutes après le repas aide à réguler le pic de glycémie.

**Ne modifiez ou n'arrêtez jamais votre traitement sans en parler à votre praticien.**`,
    },
    {
      id: 'card_medication_lithium_01',
      title: 'Lithium : Hydratation et règles de sécurité',
      summary: 'Les 3 règles essentielles pour rester en sécurité sous Lithium',
      content: `## Traitement par Lithium : Les règles de sécurité

Le Lithium est un traitement extrêmement efficace, mais il nécessite un équilibre précis dans votre corps. Cet équilibre dépend directement de l'eau et du sel que vous consommez.

### Les 3 règles d'or de l'hydratation

1. **Buvez régulièrement :** Visez 1,5 à 2 litres d'eau par jour.
2. **Ne changez pas vos habitudes de sel :** Un régime sans sel soudain fait monter dangereusement le taux de lithium.
3. **Compensez les pertes :** En cas de forte chaleur, de sport intense, ou de diarrhée/vomissements, buvez davantage d'eau riche en minéraux.

### Ce qu'il faut absolument éviter

- Les anti-inflammatoires (Ibuprofène, Advil, Nurofen). Ils sont toxiques avec le Lithium. Préférez le Paracétamol.
- Les régimes "détox" ou diurétiques.

---

**Signes d'alerte (Surdosage) :** Tremblements importants, soif extrême, nausées sévères ou confusion → contactez immédiatement votre médecin ou le **15**.

---

*Ne modifiez jamais votre dose ou votre traitement sans en parler à votre praticien.*`,
    },
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

// ─── Index général ────────────────────────────────────────────────────────────

export const MODULE_PREVIEW: Partial<Record<ModuleType, ModulePreview>> = {
  crisis_plan: CRISIS_PLAN_PREVIEW,
  sleep_diary: SLEEP_DIARY_PREVIEW,
  decisional_balance: DECISIONAL_BALANCE_PREVIEW,
  psychoeducation: PSYCHO_CARDS_PREVIEW,
  beck_columns: BECK_COLUMNS_PREVIEW,
}
