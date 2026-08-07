# PHQ-9 : source anglaise et version française officielle

> **Ce fichier est la référence.** Les valeurs i18n `modules.phq9.*` des deux apps
> doivent lui être identiques **caractère pour caractère**. Le garde-fou
> [`apps/web/src/test/phq9Translation.guard.test.ts`](../../apps/web/src/test/phq9Translation.guard.test.ts)
> échoue au moindre écart.

| | |
|---|---|
| Instrument | Patient Health Questionnaire, 9 items (PHQ-9) |
| Auteurs | Kroenke, Spitzer & Williams, 2001 |
| Version française | **Officielle, « French for France »**, distribuée par Pfizer |
| Source du document | <https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/PHQ9_French%20for%20France.pdf> |
| Date de mise en place | 7 août 2026 |
| Tickets | [#407](https://github.com/KaerOrg/Kaer/issues/407) (Q-3), puis correction vers la version officielle |

## Régime de droits : tout est libre, y compris la traduction

Le PDF « French for France » porte lui-même, en pied de page, la mention suivante :

> Développé par les Dr Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke et leurs
> collègues grâce à une allocation d'études de Pfizer Inc. **La reproduction, la
> traduction, l'affichage ou la distribution de ce document sont autorisés.**

C'est la **même autorisation** que celle qui libère l'instrument en anglais, appliquée
au document français. Il n'y a donc **aucun ayant droit tiers** sur cette traduction, et
rien à demander à personne.

**La citation des auteurs reste due et non négociable.** Elle est indépendante de la
question de la traduction et vit dans `scale_meta.instrument_citation` (#417).

### Pourquoi ce n'est pas la version que Kær avait d'abord écrite

Q-3 était parti d'un raisonnement juste appliqué au mauvais document. Le régime
restrictif documenté à l'époque, accord d'usage commercial via le Mapi Research Trust,
concerne la traduction produite par l'**institut MAPI**, distribuée par **eProvide**.
C'est une oeuvre dérivée avec ses propres ayants droit, et elle reste hors de portée.

La version « French for France » de **phqscreeners.com** est un autre document, publié
par la source qui a libéré l'instrument, et **explicitement libre par sa propre mention
de pied de page**. La conclusion « il faut produire notre propre traduction » ne s'y
appliquait pas.

Une traduction maison a été écrite et livrée le 06/08, puis remplacée par celle-ci le
07/08. Elle n'a jamais servi à une passation patient, donc aucune série n'est rompue.

### Ce que le passage à l'officielle fait gagner

- **La comparabilité.** Les totaux obtenus dans Kær se lisent désormais dans les mêmes
  mots que le corpus français publié. C'était la limite principale de la traduction
  maison, et elle disparaît.
- **La traçabilité.** On peut dire d'où viennent les mots affichés, et le montrer.
- **La fin d'une dette de vigilance.** Une traduction maison aurait exigé d'être
  défendue à chaque relecture clinique. Celle-ci ne se discute pas.

## Limites à connaître, et à écrire dans la fiche destinée au soignant

Ces limites portent sur **l'instrument en français**, pas sur la qualité de la
traduction, et elles subsistent :

- L'INESSS relève explicitement le **manque de validation en français** parmi les
  limites du questionnaire.
- Une étude menée aux HUG a trouvé environ **50 % de faux négatifs** face à l'entretien
  psychiatrique.
- Ces limites ne changent rien à l'usage qu'en fait Kær, **suivre une évolution** chez
  une même personne et non dépister. Elles sont bornées précisément parce que Kær
  **s'interdit la table de sévérité** : aucun score n'est comparé à une norme.

## Les mots ne bougent plus

Changer un libellé change les réponses. La valeur de cet instrument dans Kær tient à ce
qu'une passation se compare **à elle-même dans le temps**, chez la même personne, avec
les mêmes mots.

Le texte est désormais celui du document officiel, **au mot et à la virgule près**. Il
ne se reformule pas, ne s'harmonise pas, ne se « corrige » pas : toute divergence avec le
PDF est un défaut, pas une amélioration.

## Portée des items

L'item 10 mesure le **retentissement fonctionnel**. Il fait partie du formulaire officiel
mais **n'entre pas dans le score** : le total du PHQ-9 est la somme des items 1 à 9, sur
0 à 27. Son intégration fonctionnelle est traitée par Q-6 (#410).

## Le contenu de référence

Le bloc ci-dessous est la source machine du garde-fou. `en` est l'original, `fr` la
version officielle française. Les clés sont celles de `modules.phq9.*` dans les locales
des deux apps.

**Deux écarts de forme, et deux seulement**, tous documentés ici :

1. **Apostrophes droites** (`'`) là où le PDF utilise l'apostrophe typographique (`’`).
   Normalisation appliquée à toute l'app : une seule famille de glyphes dans l'interface.
   Aucun mot, aucune virgule n'est touché.
2. **La consigne de cochage** du PDF, « (Veuillez cocher (✔) votre réponse) », **n'est
   pas reprise** : elle décrit un geste de formulaire papier qui n'existe pas dans
   l'application, où l'on touche une réponse. Ce n'est pas du contenu psychométrique.

La consigne d'en-tête est scindée en `instructions_1` / `instructions_2` par le moteur de
rendu ; leur concaténation restitue la phrase du PDF à l'identique.

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
    "instructions_2": "selon quelle fréquence avez-vous été gêné(e) par les problèmes suivants ?",
    "opt_0": "Jamais",
    "opt_1": "Plusieurs jours",
    "opt_2": "Plus de la moitié du temps",
    "opt_3": "Presque tous les jours",
    "q1": "Peu d'intérêt ou de plaisir à faire les choses",
    "q2": "Être triste, déprimé(e) ou désespéré(e)",
    "q3": "Difficultés à s'endormir ou à rester endormi(e), ou dormir trop",
    "q4": "Se sentir fatigué(e) ou manquer d'énergie",
    "q5": "Avoir peu d'appétit ou manger trop",
    "q6": "Avoir une mauvaise opinion de soi-même, ou avoir le sentiment d'être nul(le), ou d'avoir déçu sa famille ou s'être déçu(e) soi-même",
    "q7": "Avoir du mal à se concentrer, par exemple, pour lire le journal ou regarder la télévision",
    "q8": "Bouger ou parler si lentement que les autres auraient pu le remarquer. Ou au contraire, être si agité(e) que vous avez eu du mal à tenir en place par rapport à d'habitude",
    "q9": "Penser qu'il vaudrait mieux mourir ou envisager de vous faire du mal d'une manière ou d'une autre",
    "q10": "Si vous avez coché au moins un des problèmes évoqués, à quel point ce(s) problème(s) a-t-il (ont-ils) rendu votre travail, vos tâches à la maison ou votre capacité à vous entendre avec les autres difficile(s) ?",
    "q10_opt_0": "Pas du tout difficile(s)",
    "q10_opt_1": "Assez difficile(s)",
    "q10_opt_2": "Très difficile(s)",
    "q10_opt_3": "Extrêmement difficile(s)"
  }
}
```

## Deux points de vigilance pour les sessions suivantes

**« Plus de la moitié du temps », et non « des jours ».** La version française officielle
dit *du temps* là où l'anglais dit *the days*. C'est le texte officiel : on ne le
« corrige » pas vers l'anglais.

**Les items mélangent les formes grammaticales**, groupes nominaux et infinitifs. C'est
ainsi dans le document officiel. Uniformiser serait produire une autre traduction, donc
sortir du régime libre et casser la comparabilité. **Ne pas y toucher.**

## Ce que ce fichier ne porte pas

- **La citation des auteurs et l'attribution** : traitées par Q-13 (#417), dans
  `scale_meta.instrument_citation` et `scale_meta.translation_attribution`.
- **La référence de recommandation clinique** : `scale_meta.reference_label` porte NICE
  NG222 et l'APA. Ce n'est **pas** une citation de copyright.
- **La table de sévérité** : elle n'entre pas dans le produit, ni côté patient ni côté
  praticien.
