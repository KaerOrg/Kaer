// Dictionnaire local des cartes de psychoéducation.
// Le contenu est stocké ici (frontend), la BDD ne stocke que les IDs débloqués.
// Format du contenu : Markdown.

export interface PsychoCard {
  id: string
  title: string
  summary: string
  icon: string // nom d'icône MaterialCommunityIcons
  content: string // Markdown
}

export const PSYCHOEDUCATION_CARDS: Record<string, PsychoCard> = {
  // ─── Carte 1 : Hygiène du sommeil ───────────────────────────────────────────
  card_sleep_01: {
    id: 'card_sleep_01',
    title: "Règles d'hygiène du sommeil",
    summary: '10 conseils pour améliorer la qualité de votre sommeil',
    icon: 'sleep',
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

  // ─── Carte 2 : Ancrage 5-4-3-2-1 ───────────────────────────────────────────
  card_grounding_01: {
    id: 'card_grounding_01',
    title: "Technique d'ancrage 5-4-3-2-1",
    summary: "Revenir au moment présent en cas d'anxiété ou de dissociation",
    icon: 'hand-heart',
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

#### 👁️ 5 choses que vous voyez

Regardez autour de vous et nommez mentalement (ou à voix haute) 5 éléments :

*"Je vois la fenêtre, une plante verte, mes mains, la lumière du couloir, un livre posé sur la table."*

#### ✋ 4 choses que vous touchez

Portez attention aux textures et sensations physiques :

*"Je sens le tissu de mon vêtement, la dureté de la chaise, le froid de la vitre, le poids de mes clés."*

#### 👂 3 choses que vous entendez

Fermez les yeux et identifiez 3 sons :

*"J'entends ma respiration, le bruit de la rue, le ronronnement du frigo."*

#### 👃 2 choses que vous sentez

Identifiez deux odeurs, même subtiles :

*"Je sens l'air de la pièce, une légère odeur de café."*

#### 👅 1 chose que vous goûtez

Notez le goût présent dans votre bouche :

*"Je goûte un reste de menthe, ou simplement le goût de ma salive."*

---

**Prenez à nouveau une grande inspiration.**

Si l'angoisse est toujours là, **recommencez le cycle avec d'autres objets**.

---

### À retenir

- Prenez votre temps à chaque étape.
- Il n'y a pas de "bonne" réponse — l'important est de **focaliser votre attention**.
- Cette technique demande un peu de pratique pour devenir automatique. Entraînez-vous **avant** les moments de crise pour qu'elle soit disponible quand vous en avez besoin.

---

*Partagez votre expérience avec cette technique à votre praticien lors de votre prochain rendez-vous.*`,
  },

  // ─── Carte 4 : Traitements et appétit ──────────────────────────────────────
  card_medication_appetite_01: {
    id: 'card_medication_appetite_01',
    title: 'Traitements et Appétit : Reprendre le contrôle',
    summary: 'Comprendre et gérer la faim liée aux traitements',
    icon: 'pill',
    content: `## 🍎 Traitements et Appétit : Reprendre le contrôle

Certains traitements (comme les antipsychotiques ou les thymorégulateurs) peuvent modifier votre métabolisme et bloquer le signal de satiété envoyé à votre cerveau. **Vous n'êtes pas coupable d'avoir faim, c'est un effet biologique du traitement.**

Voici des stratégies comportementales pour limiter la prise de poids sans faire de régime restrictif (qui serait contre-productif) :

* **La règle des 20 minutes :** Le cerveau met 20 minutes à comprendre que l'estomac est plein. Mangez lentement, posez votre fourchette entre chaque bouchée.
* **Volume et Fibres :** Si la faim persiste, augmentez le volume de votre repas avec des légumes verts ou des aliments riches en fibres. Ils distendent l'estomac et forcent le signal de satiété.
* **Le piège de la soif :** Les traitements assèchent la bouche. On confond souvent cette soif avec une envie de sucre. Buvez un grand verre d'eau avant chaque grignotage et attendez 10 minutes.
* **Mouvement doux :** Une marche de 15 minutes après le repas aide à réguler le pic de glycémie.

⚠️ **Ne modifiez ou n'arrêtez jamais votre traitement sans en parler à votre praticien.**`,
  },

  // ─── Carte 5 : Lithium — Hydratation et sécurité ────────────────────────────
  card_medication_lithium_01: {
    id: 'card_medication_lithium_01',
    title: 'Lithium : Hydratation et règles de sécurité',
    summary: 'Les 3 règles essentielles pour rester en sécurité sous Lithium',
    icon: 'water',
    content: `## 💧 Traitement par Lithium : Les règles de sécurité

Le Lithium est un traitement extrêmement efficace, mais il nécessite un équilibre précis dans votre corps. Cet équilibre dépend directement de l'eau et du sel que vous consommez.

### ✅ Les 3 règles d'or de l'hydratation

1. **Buvez régulièrement :** Visez 1,5 à 2 litres d'eau par jour.
2. **Ne changez pas vos habitudes de sel :** Un régime sans sel soudain fait monter dangereusement le taux de lithium. Une consommation excessive de sel le fait baisser. Gardez une consommation stable.
3. **Compensez les pertes :** En cas de forte chaleur, de sport intense, ou de diarrhée/vomissements, buvez davantage d'eau riche en minéraux.

### 🚫 Ce qu'il faut absolument éviter

* Les anti-inflammatoires (comme l'Ibuprofène, l'Advil ou le Nurofen). Ils sont toxiques avec le Lithium. Préférez le Paracétamol.
* Les régimes "détox" ou diurétiques.

---

🚨 **Signes d'alerte (Surdosage) :** Si vous ressentez des tremblements importants des mains, une soif extrême, des nausées sévères ou une confusion, contactez immédiatement votre médecin ou le **15**.

---

*Ne modifiez jamais votre dose ou votre traitement sans en parler à votre praticien.*`,
  },

  // ─── Carte 3 : Distorsions cognitives ───────────────────────────────────────
  card_cbt_01: {
    id: 'card_cbt_01',
    title: 'Identifier les distorsions cognitives',
    summary: 'Reconnaître les pièges de la pensée automatique',
    icon: 'head-cog-outline',
    content: `## Identifier les distorsions cognitives

Les **distorsions cognitives** sont des façons automatiques et déformées d'interpréter la réalité. Les reconnaître est la première étape pour les modifier.

### Les 10 distorsions les plus courantes

---

#### 1. La pensée tout-ou-rien

Vous voyez les choses de façon extrême, sans nuance.

*"Si je ne réussis pas parfaitement, je suis un(e) raté(e)."*

---

#### 2. La surgénéralisation

Un événement négatif devient une règle universelle.

*"J'ai échoué une fois → j'échoue toujours."*

Mots-clés : *toujours, jamais, tout le monde, personne...*

---

#### 3. Le filtre mental

Vous ne voyez que les aspects négatifs d'une situation, ignorant les positifs.

*"La soirée s'est bien passée, mais j'ai dit quelque chose de maladroit → la soirée était nulle."*

---

#### 4. La disqualification du positif

Les expériences positives "ne comptent pas".

*"J'ai eu ce compliment, mais il ne le pensait pas vraiment."*

---

#### 5. La lecture de pensée

Vous supposez savoir ce que les autres pensent.

*"Il ne m'a pas répondu → il est énervé contre moi."*

---

#### 6. La prédiction négative

Vous anticipez que les choses vont mal se passer.

*"Je vais rater cet entretien de toute façon."*

---

#### 7. La catastrophisation

Vous exagérez l'importance d'un problème.

*"J'ai oublié ce détail → c'est une catastrophe."*

---

#### 8. Le raisonnement émotionnel

Vous confondez une émotion avec une réalité.

*"Je me sens incompétent(e) → donc je suis incompétent(e)."*

---

#### 9. Les "il faut / je dois"

Des règles rigides et exigeantes envers vous-même ou les autres.

*"Je dois toujours être fort(e). Les autres devraient comprendre."*

---

#### 10. L'étiquetage

Vous vous assignez une identité négative globale.

*"J'ai fait une erreur → je suis nul(le)."*

---

### Comment les utiliser ?

Quand vous ressentez une émotion intense, posez-vous ces questions :

1. Quelle pensée automatique est apparue ?
2. Cette pensée correspond-elle à une distorsion ?
3. Quelle serait une façon plus réaliste et nuancée de voir la situation ?

---

*Votre praticien peut vous accompagner dans ce travail, notamment avec les Colonnes de Beck.*`,
  },
}
