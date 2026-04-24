export const GAD7_DATA = {
  id: 'gad-7',
  title: "Échelle d'Anxiété Généralisée (GAD-7)",
  instructions: 'Au cours des 2 dernières semaines, à quelle fréquence avez-vous été gêné(e) par les problèmes suivants ?',
  options: [
    { text: 'Jamais', value: 0 },
    { text: 'Plusieurs jours', value: 1 },
    { text: 'Plus de la moitié du temps', value: 2 },
    { text: 'Presque tous les jours', value: 3 },
  ],
  questions: [
    "Vous êtes-vous senti(e) nerveux(se), anxieux(se) ou à cran ?",
    "Avez-vous été incapable d'arrêter de vous en faire ou de contrôler vos inquiétudes ?",
    "Vous êtes-vous trop inquiété(e) pour différentes choses ?",
    "Avez-vous eu du mal à vous détendre ?",
    "Avez-vous été tellement agité(e) qu'il était difficile de tenir en place ?",
    "Vous êtes-vous senti(e) facilement agacé(e) ou irritable ?",
    "Avez-vous eu peur que quelque chose de terrible n'arrive ?",
  ],
} as const
