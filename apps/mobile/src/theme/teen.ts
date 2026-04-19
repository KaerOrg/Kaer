// Palette et styles spécifiques au mode ado.
// Utilisé uniquement via le hook useTeen — ne pas importer directement dans les écrans.

// Couleur vive par catégorie de module (pour les cards HomeScreen et headers)
export const TEEN_MODULE_COLORS: Record<string, string> = {
  // Sécurité & Crise → rouge-rose vif
  crisis_plan:              '#FF4D6D',
  therapeutic_commitment:   '#FF4D6D',
  distress_tolerance:       '#FF4D6D',
  // Surveillance & Somatique → violet moyen
  medication_side_effects:  '#8B5CF6',
  medication_adherence:     '#8B5CF6',
  psychoeducation:          '#8B5CF6',
  // Hygiène de vie → bleu-cyan
  sleep_diary:              '#06B6D4',
  diet_weight_psycho:       '#06B6D4',
  chronobiology_tracker:    '#06B6D4',
  // Émotions & Humeur → orange-corail
  mood_tracker:             '#F97316',
  emotion_wheel:            '#F97316',
  behavioral_activation:    '#F97316',
  // Restructuration cognitive → vert menthe
  beck_columns:             '#10B981',
  cognitive_distortions:    '#10B981',
  grounding:                '#10B981',
  rim:                      '#10B981',
  // Anxiété → jaune-doré
  fear_thermometer:         '#F59E0B',
  exposure_hierarchy:       '#F59E0B',
  breathing_techniques:     '#F59E0B',
  cognitive_saturation:     '#F59E0B',
  // Addictologie → rose fuchsia
  craving_journal:          '#EC4899',
  decisional_balance:       '#EC4899',
}

// Couleur de fallback si le module n'est pas dans la map
export const TEEN_DEFAULT_COLOR = '#6366F1'

// Retourne la couleur vive d'un module, ou le fallback
export function teenColorFor(moduleType: string): string {
  return TEEN_MODULE_COLORS[moduleType] ?? TEEN_DEFAULT_COLOR
}

// Styles additionnels appliqués aux cards en mode ado
export const teenCardStyle = {
  borderLeftWidth: 4,
  borderRadius: 14,
} as const

// Textes adaptés : tutoiement + langage simplifié
// Format : { adulte: string, ado: string } — seule la version ado est utilisée en teen mode
// Organisé par module puis par clé de texte

export interface BilingualText {
  adult: string
  teen: string
}

// Textes globaux (HomeScreen, navigation)
export const TEEN_GLOBAL: Record<string, BilingualText> = {
  greeting: {
    adult: 'Bienvenue',
    teen: 'Salut !',
  },
  modulesTitle: {
    adult: 'Vos outils',
    teen: 'Tes outils',
  },
  noModules: {
    adult: 'Aucun outil débloqué pour le moment.',
    teen: "Pas encore d'outil débloqué — ton soignant s'en occupe.",
  },
}

// Textes par module
export const TEEN_MODULE_TEXTS: Record<string, Record<string, BilingualText>> = {
  crisis_plan: {
    title: { adult: 'Mon plan de crise', teen: 'Mon plan si ça va pas' },
    intro: {
      adult: 'Ce plan vous aidera à traverser les moments difficiles.',
      teen: 'Ce plan est là pour t\'aider quand ça devient trop dur.',
    },
    step_warning_signs: {
      adult: 'Signes avant-coureurs',
      teen: 'Quand je sens que ça tourne mal',
    },
    step_coping: {
      adult: 'Stratégies personnelles',
      teen: 'Ce qui m\'aide à me calmer',
    },
    step_distractions: {
      adult: 'Activités distrayantes',
      teen: 'Ce qui me change les idées',
    },
    step_contacts: {
      adult: 'Personnes à contacter',
      teen: 'À qui je peux parler',
    },
    step_professionals: {
      adult: 'Professionnels de santé',
      teen: 'Mon équipe soignante',
    },
    step_safe_environment: {
      adult: 'Sécuriser l\'environnement',
      teen: 'Rendre mon espace plus sûr',
    },
    save: { adult: 'Enregistrer', teen: 'Sauvegarder' },
    placeholder_generic: {
      adult: 'Notez ici…',
      teen: 'Écris ici…',
    },
  },
  beck_columns: {
    title: { adult: 'Colonnes de Beck', teen: 'Démêler mes pensées' },
    intro: {
      adult: 'Identifiez et restructurez vos pensées automatiques.',
      teen: 'Note ta pensée négative et on va la décortiquer ensemble.',
    },
    col_situation: { adult: 'Situation', teen: 'Ce qui s\'est passé' },
    col_emotion: { adult: 'Émotion', teen: 'Ce que j\'ai ressenti' },
    col_thought: { adult: 'Pensée automatique', teen: 'Ce que j\'ai pensé direct' },
    col_distortion: { adult: 'Distorsion cognitive', teen: 'Le piège de la pensée' },
    col_reframe: { adult: 'Pensée alternative', teen: 'Une autre façon de voir' },
    save: { adult: 'Enregistrer', teen: 'Valider' },
  },
  grounding: {
    title: { adult: 'Ancrage 5-4-3-2-1', teen: 'Revenir ici et maintenant' },
    intro: {
      adult: 'Cette technique vous aide à vous reconnecter au moment présent.',
      teen: 'Quand tout s\'emballe, cette technique te ramène dans le présent.',
    },
    step_see: { adult: '5 choses que vous voyez', teen: '5 trucs que tu vois' },
    step_touch: { adult: '4 choses que vous touchez', teen: '4 trucs que tu touches' },
    step_hear: { adult: '3 choses que vous entendez', teen: '3 trucs que tu entends' },
    step_smell: { adult: '2 choses que vous sentez', teen: '2 odeurs autour de toi' },
    step_taste: { adult: '1 chose que vous goûtez', teen: '1 goût dans ta bouche' },
  },
  mood_tracker: {
    title: { adult: 'Thermomètre de l\'humeur', teen: 'Comment tu vas ?' },
    intro: {
      adult: 'Notez votre humeur, énergie et anxiété du jour.',
      teen: 'Dis-moi comment tu te sens aujourd\'hui.',
    },
    mood: { adult: 'Humeur', teen: 'Humeur' },
    energy: { adult: 'Énergie', teen: 'Énergie' },
    anxiety: { adult: 'Anxiété', teen: 'Stress / Anxiété' },
    save: { adult: 'Enregistrer', teen: 'Valider' },
  },
  fear_thermometer: {
    title: { adult: 'Thermomètre de la peur', teen: 'Mon niveau de stress' },
    intro: {
      adult: 'Évaluez votre niveau de détresse sur une échelle de 0 à 100.',
      teen: 'Donne un chiffre à ton stress en ce moment (0 = super calme, 100 = panique totale).',
    },
    save: { adult: 'Enregistrer', teen: 'Valider' },
  },
  decisional_balance: {
    title: { adult: 'Balance décisionnelle', teen: 'Le pour et le contre' },
    intro: {
      adult: 'Explorez votre ambivalence face au changement.',
      teen: 'Tu hésites ? Mettons tout à plat pour y voir plus clair.',
    },
    pros_change: { adult: 'Avantages du changement', teen: 'Pourquoi changer serait bien' },
    cons_change: { adult: 'Inconvénients du changement', teen: 'Ce que ça m\'coûterait de changer' },
    pros_status: { adult: 'Avantages du statu quo', teen: 'Pourquoi rester comme je suis' },
    cons_status: { adult: 'Inconvénients du statu quo', teen: 'Ce que ça me coûte de pas changer' },
    motivation: { adult: 'Motivation au changement', teen: 'Mon envie de changer' },
  },
  sleep_diary: {
    title: { adult: 'Agenda du sommeil', teen: 'Mon journal de nuit' },
    intro: {
      adult: 'Notez votre sommeil chaque matin.',
      teen: 'Note chaque matin comment tu as dormi.',
    },
    save: { adult: 'Enregistrer', teen: 'Valider' },
  },
  medication_side_effects: {
    title: { adult: 'Effets du traitement', teen: 'Mon traitement — effets ressentis' },
    intro: {
      adult: 'Notez les effets secondaires ressentis.',
      teen: 'Tu ressens des effets bizarres avec ton traitement ? Note-les ici.',
    },
    save: { adult: 'Enregistrer', teen: 'Valider' },
  },
  medication_adherence: {
    title: { adult: 'Observance du traitement', teen: 'Mes prises de traitement' },
    intro: {
      adult: 'Avez-vous pris votre traitement cette semaine ?',
      teen: 'T\'as pris ton traitement cette semaine ?',
    },
    save: { adult: 'Enregistrer', teen: 'Valider' },
  },
  behavioral_activation: {
    title: { adult: 'Activation comportementale', teen: 'Mes activités plaisir' },
    intro: {
      adult: 'Planifiez des activités sources de plaisir ou de satisfaction.',
      teen: 'On va trouver des activités qui te font du bien et les planifier.',
    },
    save: { adult: 'Enregistrer', teen: 'Valider' },
  },
  breathing_techniques: {
    title: { adult: 'Techniques de respiration', teen: 'Respirer pour se calmer' },
    intro: {
      adult: 'Choisissez un exercice de respiration.',
      teen: 'Choisis un exercice — ça peut vraiment aider à redescendre.',
    },
  },
  rim: {
    title: { adult: 'RIM – Imagerie mentale', teen: 'Réécrire le cauchemar' },
    intro: {
      adult: 'Retraitement par l\'imagerie mentale.',
      teen: 'On va transformer ton cauchemar en quelque chose de mieux.',
    },
  },
  cognitive_saturation: {
    title: { adult: 'Saturation cognitive', teen: 'Stop aux ruminations' },
    intro: {
      adult: 'Interrompez les ruminations par répétition rapide.',
      teen: 'Cette technique coupe les pensées qui tournent en boucle.',
    },
  },
  emotion_wheel: {
    title: { adult: 'Roue des émotions', teen: 'Ce que je ressens vraiment' },
    intro: {
      adult: 'Explorez et nommez vos émotions.',
      teen: 'Explore et mets des mots sur ce que tu ressens.',
    },
  },
  psychoeducation: {
    title: { adult: 'Psychoéducation', teen: 'Comprendre ma santé mentale' },
    intro: {
      adult: 'Consultez vos fiches de savoir.',
      teen: 'Lis ces fiches pour mieux comprendre ce que tu vis.',
    },
  },
}
