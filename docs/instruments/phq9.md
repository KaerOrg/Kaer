# PHQ-9 : source anglaise et traduction Kær

> **Ce fichier est la référence.** Les valeurs i18n `modules.phq9.*` des deux apps
> doivent lui être identiques **caractère pour caractère**. Le garde-fou
> [`apps/web/src/test/phq9Translation.guard.test.ts`](../../apps/web/src/test/phq9Translation.guard.test.ts)
> échoue au moindre écart.

| | |
|---|---|
| Instrument | Patient Health Questionnaire, 9 items (PHQ-9) |
| Auteurs | Kroenke, Spitzer & Williams, 2001 |
| Traduction française | Kær |
| Date de la traduction | 6 août 2026 |
| Ticket | [#407](https://github.com/KaerOrg/Kaer/issues/407) (Q-3), Epic [#404](https://github.com/KaerOrg/Kaer/issues/404) |

## Régime de droits

**L'instrument est libre.** Pfizer a libéré le PHQ-9 : « no permission is required to
reproduce, translate, display or distribute ». La **citation des auteurs** reste due et
non négociable, elle est traitée par Q-13.

**Le droit de traduire est acquis, celui de reprendre la traduction d'un tiers ne l'est
pas.** Une traduction publiée est une oeuvre dérivée avec ses propres ayants droit. La
version française dite officielle a été produite par l'institut MAPI et distribuée par
le Mapi Research Trust sous accord d'usage commercial ; c'est le régime de tout tiers
traducteur, pas une singularité de MAPI.

**La traduction ci-dessous est donc la nôtre**, produite depuis l'original anglais.
Aucune formulation n'est reprise d'une version tierce. La demande à eProvide, un temps
envisagée, a été annulée le 06/08 : elle n'était pas nécessaire.

## Limites à connaître, et à écrire dans la fiche destinée au soignant

- **La traduction Kær n'est pas validée psychométriquement.** Les totaux obtenus dans
  Kær **ne se comparent pas** au corpus français publié.
- L'INESSS relève explicitement le manque de validation en français parmi les limites
  du QSP-9, et une étude menée aux HUG a trouvé environ **50 % de faux négatifs** face
  à l'entretien psychiatrique.
- Ces limites ne changent rien à l'usage qu'en fait Kær, **suivre une évolution** chez
  une même personne et non dépister. Elles sont bornées précisément parce que Kær
  **s'interdit la table de sévérité** : aucun score n'est comparé à une norme. La
  décision MDR et cette décision de traduction se tiennent l'une l'autre.

## La traduction ne bouge plus

Changer les mots change les réponses. La valeur de cet instrument dans Kær tient à ce
qu'une passation se compare **à elle-même dans le temps**, chez la même personne, avec
les mêmes mots.

Toute retouche ultérieure d'un libellé est une **rupture de série**, pas une correction
rédactionnelle : elle se traite comme telle, avec une décision explicite et une date de
bascule. Ne pas « améliorer » un libellé, ne pas harmoniser le style, ne pas lisser la
ponctuation.

## Portée des items

L'item 10 mesure le **retentissement fonctionnel**. Il fait partie du formulaire
officiel mais **n'entre pas dans le score** : le total du PHQ-9 est la somme des items 1
à 9, sur 0 à 27. Son intégration fonctionnelle est traitée par Q-6 (#410).

## Le contenu de référence

Le bloc ci-dessous est la source machine du garde-fou. `en` est l'original, `fr` la
traduction Kær. Les clés sont celles de `modules.phq9.*` dans les locales des deux apps.

```json
{
  "en": {
    "instructions_1": "Over the last 2 weeks,",
    "instructions_2": "how often have you been bothered by any of the following problems?",
    "opt_0": "Not at all",
    "opt_1": "Several days",
    "opt_2": "More than half the days",
    "opt_3": "Nearly every day",
    "q1": "Little interest or pleasure in doing things",
    "q2": "Feeling down, depressed, or hopeless",
    "q3": "Trouble falling or staying asleep, or sleeping too much",
    "q4": "Feeling tired or having little energy",
    "q5": "Poor appetite or overeating",
    "q6": "Feeling bad about yourself, or that you are a failure, or have let yourself or your family down",
    "q7": "Trouble concentrating on things, such as reading the newspaper or watching television",
    "q8": "Moving or speaking so slowly that other people could have noticed. Or the opposite, being so fidgety or restless that you have been moving around a lot more than usual",
    "q9": "Thoughts that you would be better off dead or of hurting yourself in some way",
    "q10": "If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
    "q10_opt_0": "Not difficult at all",
    "q10_opt_1": "Somewhat difficult",
    "q10_opt_2": "Very difficult",
    "q10_opt_3": "Extremely difficult"
  },
  "fr": {
    "instructions_1": "Au cours des 2 dernières semaines,",
    "instructions_2": "à quelle fréquence avez-vous été gêné(e) par les problèmes suivants ?",
    "opt_0": "Jamais",
    "opt_1": "Plusieurs jours",
    "opt_2": "Plus de la moitié des jours",
    "opt_3": "Presque tous les jours",
    "q1": "Peu d'intérêt ou de plaisir à faire les choses",
    "q2": "Vous sentir abattu(e), déprimé(e) ou sans espoir",
    "q3": "Des difficultés à vous endormir ou à rester endormi(e), ou dormir trop",
    "q4": "Vous sentir fatigué(e) ou avoir peu d'énergie",
    "q5": "Peu d'appétit ou manger trop",
    "q6": "Avoir une mauvaise opinion de vous-même, ou penser que vous avez échoué, ou que vous vous êtes déçu(e) ou avez déçu votre famille",
    "q7": "Des difficultés à vous concentrer, par exemple pour lire le journal ou regarder la télévision",
    "q8": "Bouger ou parler si lentement que d'autres personnes ont pu le remarquer. Ou à l'inverse, être si agité(e) ou nerveux(se) que vous avez bougé beaucoup plus que d'habitude",
    "q9": "Penser que vous seriez mieux mort(e), ou penser à vous faire du mal d'une manière ou d'une autre",
    "q10": "Si vous avez signalé au moins un problème, quel degré de difficulté ces problèmes vous ont-ils causé dans votre travail, dans la tenue de votre foyer ou dans vos relations avec les autres ?",
    "q10_opt_0": "Aucune difficulté",
    "q10_opt_1": "Une certaine difficulté",
    "q10_opt_2": "Une grande difficulté",
    "q10_opt_3": "Une difficulté extrême"
  }
}
```

## Notes de traduction, item par item

Ces notes existent pour qu'une session ultérieure sache **pourquoi** un mot a été
choisi, et n'aille pas le « corriger » vers une formulation tierce.

| Item | Choix, et ce qu'il évite |
|---|---|
| Consigne | « à quelle fréquence » rend `how often` : la question porte sur une fréquence, ce qui commande aussi le choix des modalités |
| `opt_0` | « Jamais » plutôt que « Pas du tout » : la consigne demandant une fréquence, une modalité de fréquence est plus cohérente que le degré littéral de `Not at all` |
| `q2` | « abattu(e) » pour `down`, plus proche que « triste », qui rendrait `sad` |
| `q3` | « ou dormir trop » sans ajouter d'articulation adversative : l'original n'en porte pas à cet item |
| `q5` | « Peu d'appétit » pour `Poor appetite`, en écho à « Peu d'intérêt » de `q1`, comme l'original fait écho avec `Little` / `Poor` |
| `q6` | Formulation en trois propositions, au plus près de la structure anglaise. Évite délibérément « nul(le) » et surtout « un perdant », marqueur caractéristique de la version québécoise, dont la reprise serait un aveu de copie |
| `q8` | « Ou à l'inverse » rend `Or the opposite`, présent dans l'original à cet item seulement |
| `q9` | « vous faire du mal » rend `hurting yourself in some way`. Aucun moyen n'est nommé, conformément au lexique du programme Papageno et de l'OMS (2023) |
| `q10` | Construction nominale (« quel degré de difficulté ») : le français rend mal `how difficult have these problems made it for you to...` en construction verbale, l'accord du participe sur une liste de compléments devenant fautif ou lourd. Les modalités suivent la même construction nominale |

## Ce que ce fichier ne porte pas

- **La citation des auteurs et l'attribution** : traitées par Q-13 (#417).
  `translation_attribution` **reste nul pour le PHQ-9**, définitivement : il n'y a
  aucun tiers à attribuer.
- **La référence de recommandation clinique** : `scale_meta.reference_label` porte déjà
  NICE NG222 et l'APA. Ce n'est **pas** une citation de copyright, et la citation des
  auteurs ne s'y empile pas.
- **La table de sévérité** : elle n'entre pas dans le produit, ni côté patient ni côté
  praticien.
