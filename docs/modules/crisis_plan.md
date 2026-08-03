# Module — Mon plan de sécurité (`crisis_plan`)

> **Renommage.** Le module s'appelle « Mon plan de sécurité » (ex « Plan de crise »).
> Le `module_id` en base reste **`crisis_plan`** : c'est une clé de persistance
> (`plan_items.module_id`, `crisis_plan_configs`, les `text_code`, la RLS). Seuls les
> libellés i18n changent. Le renommage complet des libellés est porté par P-2.

## Base clinique

- **Safety Planning Intervention** — Stanley & Brown, modèle en **six étapes**
  (signes d'alerte → stratégies internes → personnes et lieux de diversion → proches à
  contacter → professionnels → mise à distance des moyens).
- **NICE NG225** (2022) : le plan est **co-construit** avec la personne **et revu à
  chaque contact**.
- **À qui** : adultes et adolescents (mode ado). Construit en consultation, utilisé
  seul entre les séances.

### Droit d'auteur : à lire avant d'écrire un libellé

Le **formulaire** Stanley-Brown est sous copyright (2008, 2021) ; son usage dans un
dossier médical électronique exige une autorisation écrite. La **méthode** (les six
étapes, cet ordre, cette logique d'escalade) n'est pas protégée et se cite librement.

**Kær utilise ses propres formulations** et cite la méthode comme une source. Ne jamais
reprendre les phrases du formulaire, ni les reformuler légèrement : juridiquement ça
reste dérivé, et cliniquement on perd la seule raison de les vouloir, qu'elles aient
été éprouvées.

## Conformité MDR 2017/745

- **La Séquence n'écrit rien.** Aucun compteur d'ouverture, aucune durée, aucune trace,
  rien côté praticien. Corollaire assumé : on ne saura pas si la Séquence sert.
  L'évaluation appartient à la consultation.
- **Sauter une étape vide est licite, lire son contenu ne l'est pas.** Le routage se
  décide sur « existe-t-il quelque chose à afficher ? », jamais sur le nombre d'items
  au-delà de zéro, leurs mots ou leur nature.
- Aucun élément déclenché par une donnée patient : ni alerte, ni score, ni seuil, ni
  couleur de gravité, ni rappel d'échéance. Les dates de l'étape 6 sont **affichées,
  jamais surveillées**.
- **L'interface ne nomme, ne liste, ne suggère et n'illustre jamais un moyen.** Les
  propositions de l'étape 6 portent sur le **verbe** ; l'objet n'existe qu'en texte
  libre saisi par le patient.
- **Lexique** (programme Papageno, OMS 2023) : *mourir par suicide*, *tentative de
  suicide*, *une personne qui pense au suicide*.

## Architecture — trois vues, deux portes

L'édition est un **état**, jamais une porte : les deux entrées de l'accueil servent
deux intentions distinctes, pas deux contenus.

```
ACCUEIL
├── « Je suis en crise »        → SÉQUENCE      (safety_sequence)
└── « Mon plan de sécurité »    → CONSULTATION  (safety_plan)
                                    ├── « Modifier »         → ÉDITION (editable_steps)
                                    └── « Je suis en crise »  → SÉQUENCE
```

| Vue | `preview_kind` | Rôle |
|---|---|---|
| Séquence | `safety_sequence` | Traversée guidée en crise, une chose à la fois |
| Consultation | `safety_plan` | Relire son plan à froid, six étapes dépliées |
| Édition | `editable_steps` | Modifier le plan |

## La Consultation (`safety_plan`)

Relire son plan à froid : vérifier un numéro, le montrer à quelqu'un, le modifier.

- **Une étape sans item n'est pas rendue du tout.** Une carte vide en crise ne dit pas
  « rien ici », elle dit « tu n'as rien », et sur un plan neuf elle le disait six fois.
  Le masquage se décide sur la **présence** d'items : routage structurel, jamais une
  lecture de leur contenu. Même invariant que le saut d'étape de la Séquence.
- **Les ancres sont en lecture seule** : `CrisisAnchorsWidget` reçoit `readOnly`. Ni
  pointillé « + Ajouter une photo », ni crayon, ni champ, ni appui long qui supprime.
  La vue montait auparavant le composant d'édition, ce qui rendait la lecture seule
  fausse, et proposait de supprimer une photo d'ancrage dans un écran qu'on ouvre
  précisément quand ça ne va pas. Les photos restent consultables en plein écran :
  regarder n'est pas modifier.
- **Le point d'entrée vers l'Édition est le libellé « Modifier »**, pas une roue
  crantée : un engrenage signifie « réglages techniques », contresens pour « je change
  le contenu de mon plan ».
- **Un bouton « Je suis en crise »** escalade vers la Séquence, en aller simple.

> La **date de dernière revue** (« Élaboré avec Dr X le 12 mars · revu le 4 juin »)
> attend **PW-5 (#324)**, qui crée `created_with_at` et `last_reviewed_at`. Elle n'a
> aucune source aujourd'hui, et la dériver de la date du dernier item lui donnerait un
> sens clinique qu'elle n'a pas. Quand elle existera : **affichée, jamais surveillée**.
> Aucun rappel, aucune mise en évidence d'une revue ancienne, aucune couleur d'ancienneté.

## La Séquence (`safety_sequence`)

### Machine à états

`home` → `step[n]` → `resources` → `closing`

Un **seul** bouton d'avancement (« Autre chose que j'ai prévu »), et c'est structurant :
un choix « ça m'aide / ça ne suffit pas » demanderait au patient de juger son état six
fois, dans le moment où juger est le plus dégradé. Effet de bord décisif : **plus aucun
jugement d'efficacité n'existe, donc plus rien à ne pas enregistrer** — le risque
réglementaire disparaît à la racine au lieu d'être géré par une règle de non-stockage.

Trois contrôles distincts, à ne pas confondre :

| Contrôle | Effet |
|---|---|
| Bouton primaire | Avance d'un écran. Sur la **dernière** étape affichée, son libellé devient « Ce qui est disponible tout de suite » : il ne promet plus « autre chose que j'ai prévu », qui serait faux |
| Retour discret | Recule d'un écran. **Obligatoire** : un appui accidentel ne doit pas coûter une étape définitivement. C'est l'argument qui écarte le geste de balayage |
| « Je m'arrête là » | **Sort** du parcours, sans confirmation, depuis n'importe quel écran |

### L'écran d'arrivée

Quelqu'un dont l'activation émotionnelle est au maximum ne peut pas lire une liste.
L'écran d'arrivée porte donc **une action dominante et trois entrées calmes**, dans un
ordre **fixe**, jamais reclassé ni dérivé d'une saisie.

| Entrée | Destination |
|---|---|
| **Suivre mon plan** (dominante, carte pleine) | Première étape affichable |
| Me mettre à l'abri | Étape 6, en un geste |
| Ce qui me donne envie de tenir | Écran de clôture |

Les raccourcis d'étape ne sont **pas codés dans le layout** : une étape déclare en
configuration qu'elle est atteignable directement, par `direct_access_label_code` (et
`direct_access_hint_code`) sur son field `step_title`. Le layout ne connaît aucun numéro
d'étape, et une étape sans item n'apparaît jamais en raccourci puisqu'elle n'est pas
affichable.

**Plan jamais rempli** : l'écran affiche « Voici ce qui est disponible tout de suite »
et les ressources d'urgence en densité pleine. Jamais « votre plan est incomplet »,
jamais rien qui se lise comme un reproche ou un manque. La bascule se décide sur
« existe-t-il au moins un item ? », qui est structurel.

> **Décision du 2026-07-31 : pas de bouton « Respirer 1 minute ».** C'est une suggestion
> pré-remplie, que l'Epic s'interdit ; si la respiration aide ce patient, elle est déjà
> à son étape 2, dans ses mots, et le bouton générique capterait l'appui qui aurait mené
> au plan personnel. Le barreau intermédiaire existe déjà, mieux fondé : « Traverser la
> vague » (`distress_tolerance`), un module **déverrouillé par un clinicien pour ce
> patient**. Ne pas rouvrir sans élément nouveau ; l'argumentaire complet est dans
> [`docs/handoff/2026-07-31-plan-de-securite.md`](../handoff/2026-07-31-plan-de-securite.md) § 7.1.

### Un écran d'étape, et rien d'autre

Le contenu est volontairement pauvre : « ÉTAPE n » en petites capitales, le titre de
l'étape en grand (serif, `fontSize.display`), le sous-titre s'il y en a un, puis les
items **tels que le patient les a écrits**, séparés par un filet. Ni pastille d'icône
colorée, ni badge de comptage, ni couleur d'étape, ni question d'élaboration : **une
seule couleur d'action sur tout le parcours**. Les couleurs et icônes par étape
existent bien en base (`bgColor`, `color`, `icon`), mais elles servent les vues
Consultation et Édition, et un test statique vérifie que la Séquence ne les lit pas.

Le retour et la progression « n / m » occupent une rangée discrète en tête, hors de la
carte de contenu. Les deux boutons du bas sont **ancrés hors du flux défilant** : les
items peuvent défiler à taille de police système maximale, l'action jamais. C'est
pourquoi `safety_sequence` figure dans `SELF_MANAGED_LAYOUTS` de `ModuleContentScreen`
— enveloppé dans le `ScrollView` de l'écran, son `flex: 1` s'effondrerait.

**Sous-titre d'étape** (`field_props.subtitle_code` sur le field `step_title`) : une
ligne, uniquement là où deux étapes voisines se confondent. L'étape 2 porte « sans
contacter personne », l'étape 3 « sans avoir à dire que je vais mal ». Config-first :
la prop porte une clé i18n, jamais le texte. Une étape sans sous-titre ne laisse aucun
trou dans la mise en page. Le même mécanisme alimente l'aperçu web, pour que le
praticien voie exactement l'écran de son patient.

### Ressources d'urgence : 3114, 15, 114

Trois entrées, une hiérarchie explicite, présentes sur **tous** les écrans des trois vues.

| | Entrée | Action | Traitement |
|---|---|---|---|
| 1 | **3114**, souffrance psychique, 24h/24, gratuit, aussi pour mes proches | `tel:` | Turquoise, libellé sombre |
| 2 | **15**, danger immédiat pour ma vie (112 en Europe) | `tel:` | Rouge plein, libellé blanc |
| 3 | **114**, le même secours par SMS ou visio, si je suis sourd(e) ou malentendant(e) | **`sms:`** | Rouge plein, libellé blanc |

**Le 114 est au même rang que le 15**, pas en dessous : c'est le relais qui donne accès
aux mêmes secours à qui ne peut pas passer un appel vocal. La couleur code la gravité de
la situation, jamais le public concerné.

Le 114 est en `sms:` et **pas** en `tel:` : composer vocalement le numéro d'un service
destiné aux personnes sourdes ou malentendantes le rendrait inutilisable par son public.
Le libellé porte le verbe correspondant, « Écrire au 114 ».

Un seul composant, `CrisisEmergencyCalls`, rend les deux densités (`compact` pour le
bandeau permanent, `full` pour l'écran des ressources). Le **nombre d'entrées est libre** :
les coordonnées viendront d'une configuration serveur. La couleur est portée par le
composant, à partir d'une `tone` sémantique (`primary` / `danger`) : les `bgColor` en dur
ont été retirés du seed, ils court-circuitaient les tokens et rendaient impossible tout
arbitrage de contraste. Détail des props : `apps/mobile/docs/design-system.md`.

> ⚠️ **Non vérifié sur appareil réel** : le comportement de `Linking.openURL('sms:114')`
> (iOS et Android, et l'absence de repli quand aucune application de messagerie n'est
> installée) reste la question ouverte n° 2 de l'Epic #315.

### L'écran des ressources : ce qui reste ouvert, jamais ce qui a échoué

**Le piège absolu ici est le cul-de-sac.** « Vous avez tout essayé » est le pire message
possible. L'écran ne porte donc aucun commentaire évaluatif, aucun décompte de ce qui a
été tenté, et **son titre est exactement celui de la variante plan vide de l'arrivée** :
il décrit ce qui reste ouvert, il ne conclut pas sur ce qui a échoué. La progression
« n / m » disparaît, et le bouton d'avancement aussi, puisqu'il se lirait comme « il
reste encore autre chose ».

Cinq issues de poids égal, une seule en rouge : Appeler le 3114, Appeler le 15, Écrire
au 114, puis, après un filet, Traverser la vague et Ce qui me donne envie de tenir.
Hiérarchiser serait une erreur : reléguer « ce qui me donne envie de tenir » en lien
discret le ferait passer pour secondaire, alors que c'est la section qui demande le moins
d'effort cognitif, donc celle qui reste accessible quand tout le reste ne l'est plus.

### « Traverser la vague » : présent ou absent, jamais grisé

Le lien vers `distress_tolerance` (onglet « Agir en crise ») apparaît sur l'écran d'étape
6 et sur l'écran des ressources, **à la seule condition que le module soit déverrouillé
pour ce patient**. Sinon il **disparaît** : un lien grisé annoncerait un outil qu'on lui
refuse. Le déverrouillage est une décision de clinicien prise sur cette personne, jamais
un calcul sur une donnée.

Le libellé décrit le **mécanisme** (« un minuteur m'accompagne 5 ou 15 minutes »), jamais
un bénéfice : « ça va t'aider à te calmer » serait une allégation. Les clés viennent du
module cible, pas de `crisis_plan` : c'est lui qui nomme ce qu'il propose.

Hors ligne, la lecture du déverrouillage échoue et le lien reste absent. Mieux vaut ne
pas proposer une porte que d'en proposer une qui ne s'ouvre pas.

### Les contacts : un verbe, jamais un numéro

`CallableContact` rend les items des étapes contactables. Trois règles le gouvernent :

1. **Le numéro n'est jamais affiché.** Le libellé du bouton est un verbe (« Appeler »,
   « Envoyer un message »). Un plan de sécurité s'ouvre dans un train ou une salle
   d'attente ; un numéro en clair l'expose à qui regarde par-dessus l'épaule.
2. **Règle constante** : un numéro existe, les boutons existent ; pas de numéro, ni
   numéro ni bouton. Aucun bouton grisé, aucun texte de remplacement : un item sans
   action ne doit jamais se lire comme un défaut.
3. **Un lieu n'est pas un contact.** L'étape 3 accepte des personnes **et** des lieux ;
   un lieu porte sa note (« à 8 minutes à pied ») à la place des boutons.

Le SMS n'est pas un confort : chez un adolescent, l'appel vocal est souvent une barrière
plus haute que la divulgation elle-même. Il est donc proposé pour un proche, et jamais
pour un professionnel (`professional = 'true'` sur l'étape 5) : un CMP ne se joint pas
par SMS.

`role` et `note` sont des champs de `plan_items` créés par **PW-1 (#320)** : tant qu'ils
n'existent pas, le composant les reçoit vides et se rend sans eux, sans laisser de trou.

### Logique pure partagée

`packages/shared/src/services/safetySequence.ts` — consommée par le layout mobile
(parcours patient) **et** le layout web (aperçu praticien). Une seule source, donc
aucune dérive de numérotation possible entre les deux plateformes.

**L'invariant MDR est porté par les signatures, pas par une convention** :
`buildDisplayableSteps` reçoit un `ReadonlySet<string>` des sections non vides, jamais
les items. Lire le contenu pour décider du parcours devient impossible à écrire.
Ne jamais élargir ces paramètres à `PlanItem[]`.

| Fonction | Rôle |
|---|---|
| `buildDisplayableSteps(ordre, sectionsNonVides)` | Étapes retenues + rang recalculé après retrait des vides |
| `advance(state, total)` | Écran suivant. Depuis un plan vide, mène directement aux ressources |
| `isLastStep(index, total)` | Pilote le changement de libellé du bouton primaire |
| `formatProgress(index, total)` | « n / m ». Chaîne vide s'il n'y a rien à numéroter |
| `currentState(path)` / `goTo` / `advancePath` / `backPath` | Chemin parcouru, voir ci-dessous |

**Le retour dépile un chemin, il ne recalcule pas un état.** Depuis que l'accueil ouvre
des raccourcis (P-6), le parcours n'est plus une ligne : un retour calculé depuis le seul
écran courant renverrait le patient là où il n'est jamais passé, l'étape 5 qu'il a sautée
ou l'écran des ressources qu'il n'a pas vu. Le layout conserve donc les écrans
**réellement traversés** (`SequencePath`, tuple non vide dont le dernier élément est
l'écran affiché), et `backPath` en retire un. C'est aussi ce qui tient la promesse de
P-7 : un appui accidentel ne coûte jamais une étape définitivement, quel que soit le
chemin emprunté.

### Zéro persistance, verrouillé par les tests

Le layout n'écrit **aucune donnée patient**. Une seule sortie est autorisée :
`reportFailedOperation` (observabilité #96), qui remonte le fait qu'une lecture
locale a échoué — télémétrie **technique**, sans saisie ni identifiant patient, donc
hors périmètre MDR. En crise, aucun message d'erreur n'est affiché : un écran qui se
plaint est pire que rien, mais l'échec ne doit pas être avalé pour autant.

Trois garde-fous, dont un statique :

1. Une traversée complète ne déclenche ni `enqueue`, ni `savePlanItem`, ni `deletePlanItem`.
2. Le plan n'est lu qu'une fois, et jamais réécrit.
3. **Test statique** : le source du layout est relu et le test échoue si un import de
   service d'écriture y apparaît. Le test runtime ne verrait pas un appel placé derrière
   une branche non parcourue ; celui-ci le voit.

### La clôture : du contenu, jamais une mesure

C'est l'écran le plus exposé à la tentation d'une mesure de fin de parcours, et il n'en
porte aucune : **pas d'échelle, pas de score, pas de « comment vous sentez-vous
maintenant ? », aucun émoticône d'état**. Une question notée en sortie de crise serait
une mesure, donc une bascule réglementaire.

Les raisons de vivre s'affichent **comme du contenu** : une grande photo, deux petites,
et la phrase du patient en grande typographie sur un panneau turquoise pâle. Aucune
affordance d'édition : ni pointillé, ni crayon, ni appui long. Pas de guillemets autour
de la phrase, c'est la sienne, pas une citation.

**Si la section est vide, elle n'existe pas** : l'écran devient un simple retour, sans le
moindre texte de manque.

### Conditions d'exécution

- **L'écran ne se met pas en veille** pendant la traversée (`useKeepAwake`), et le verrou
  est relâché au démontage, y compris sur une sortie par le bouton système.
- **Aucune reprise d'état.** L'app tuée puis rouverte arrive sur l'écran d'arrivée.
  C'est une **décision explicite**, corollaire direct de l'invariant « aucune trace » :
  restaurer supposerait d'avoir écrit où en était le patient. Et quelqu'un qui rouvre
  l'app n'est pas forcément là où il en était.
- **Sortie permanente, sans confirmation**, depuis tous les écrans.
- Le parcours tient à taille de police système maximale : largeurs fluides, textes
  rétractables, actions ancrées hors du flux défilant.

### Hors ligne

Le plan est lu depuis SQLite (`getPlanItems`) : la Séquence fonctionne sans réseau.
C'est une garantie, pas un chantier — les moments où un plan de sécurité est le plus
nécessaire coïncident avec ceux où le réseau est le plus défaillant.

**Cette garantie est verrouillée par un test statique** sur `planItemService` : il relit
le source et échoue si un client réseau y apparaît. Un test d'exécution ne verrait pas un
appel placé derrière une branche non parcourue ; celui-ci le voit.

La seule lecture réseau du parcours est la vérification du déverrouillage de
`distress_tolerance`, hors du chemin critique : elle échoue silencieusement hors ligne et
fait disparaître le lien.

## Données

`plan_items` (SQLite mobile) — `id`, `module_id`, `section_id`, `text`, `sort_order`,
`weight`, `phone`, `contact_source`, `created_at`.

> ⚠️ **Il n'existe pas de table `plan_items` côté Supabase.** Elle est locale au
> téléphone ; le serveur reçoit les items dans `patient_entries.payload` (jsonb opaque),
> poussés par `syncUpsert` avec `entry_kind: 'plan_item'`. Ce modèle est appelé à
> changer : `PW-1` sort le plan de `patient_entries` pour lui donner une table dédiée
> avec RLS dans les deux sens, parce que `RemoteSyncService` est strictement montant et
> qu'un item écrit depuis le web n'atteindrait jamais le téléphone.

## Fichiers

| Rôle | Chemin |
|---|---|
| Logique pure partagée | `packages/shared/src/services/safetySequence.ts` |
| Layout Séquence (mobile) | `apps/mobile/src/components/features/ModuleRenderer/layouts/SafetySequence/` |
| Layout Séquence (web) | `apps/web/src/components/features/ModuleRenderer/layouts/SafetySequenceLayout/` |
| Layout Consultation (mobile) | `.../layouts/SafetyPlan/` |
| Layout Édition (mobile) | `.../layouts/EditableSteps/` |
| Service items | `apps/mobile/src/services/planItemService.ts` |
| Bascule d'ouverture | `apps/mobile/src/screens/modules/ModuleContentScreen/initialPreviewKind.ts` |

## Voir aussi

- [`docs/module-engine.md`](../module-engine.md) — inventaire des `preview_kind`
- [`docs/spec/distress-tolerance-crisis.md`](../spec/distress-tolerance-crisis.md) — § 6,
  le raisonnement réglementaire du patron `crisis_companion` dont la Séquence hérite
