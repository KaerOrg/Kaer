# Croisement des modules : la timeline patient unifiée

> **Statut : note de réflexion, base de travail.** Rien n'est décidé, rien n'est
> engagé. Ce document existe pour être discuté, contesté et amendé.
> **Destinataires : équipe de développement Kær.**
> **Date : 13 juillet 2026.**
> **Périmètre : transverse à tous les modules, mobile patient et web praticien.**

---

## 1. L'idée en une page

Kær compte aujourd'hui une trentaine de modules thérapeutiques qui **s'ignorent
totalement**. Chacun stocke ses données dans sa table, les affiche dans son écran, et
n'a aucune conscience de l'existence des autres. Le patient qui suit son humeur, son
observance médicamenteuse et son sommeil produit trois flux de données parallèles qui
ne se rencontrent jamais, ni sur son téléphone, ni sur l'écran de son praticien.

Or **le sens clinique n'est presque jamais dans une courbe isolée**. Il est dans la
rencontre entre deux courbes. « L'humeur baisse en semaine 3 » n'apprend rien à
personne. « L'humeur baisse en semaine 3, et le traitement a changé le 8 » est une
hypothèse de travail. « L'humeur baisse, les effets indésirables sont montés en flèche
il y a dix jours, et l'observance s'est effondrée depuis » est une consultation
entière.

Ce recoupement, le clinicien le fait déjà : de tête, en feuilletant, en interrogeant.
La proposition de ce document est de **le lui épargner**, sans jamais le faire à sa
place.

**Ce que ça change pour le produit.** On ne parle pas d'une fonctionnalité de plus. On
parle du passage d'une **collection de modules** à un **dossier de suivi**. C'est,
selon moi, le changement de nature qui différencie Kær d'un carnet numérique parmi
d'autres.

---

## 2. Le cadre réglementaire : la ligne à ne pas franchir

Kær est un **carnet de bord numérique non-dispositif médical** (règle d'or du projet,
MDR 2017/745). Croiser des données est précisément l'endroit où l'on peut basculer
sans s'en rendre compte du côté du dispositif médical. Il faut donc poser la frontière
avant de poser le code.

Trois niveaux, qui n'ont pas du tout le même statut :

| Niveau | Description | Exemple | Statut |
|---|---|---|---|
| **1. Juxtaposition factuelle** | Un évènement daté d'un module est reporté tel quel sur l'axe temporel d'un autre. Aucun calcul, aucune mise en relation. | Un repère vertical « changement de traitement, 8 juillet » sur la courbe d'humeur. | **Conforme.** C'est du report, pas de l'interprétation. |
| **2. Superposition choisie** | Le praticien empile lui-même les couches qu'il veut voir. L'outil rend le croisement possible, il ne le suggère pas. | Une timeline où l'on active « humeur », « sommeil », « observance ». Rien n'est pré-sélectionné. | **Conforme**, à condition qu'aucune combinaison ne soit proposée comme « pertinente ». |
| **3. Corrélation calculée** | Le logiciel met les données en relation et produit une information orientant une décision. | « Votre humeur est plus basse les jours où l'observance est incomplète. » | **Dispositif médical.** Marquage CE, classe IIa vraisemblable. Hors périmètre. |

**Décision proposée : viser les niveaux 1 et 2, concevoir l'architecture pour que le
niveau 3 reste possible plus tard sans réécriture, et l'exclure explicitement du
produit.**

Ce n'est pas un renoncement. Un praticien n'a pas besoin qu'on lui calcule une
corrélation sur trente points de données, il a besoin de **voir**. Et une corrélation
automatique sur un si petit échantillon serait de toute façon scientifiquement
douteuse et cliniquement dangereuse.

**Corollaire d'affichage, valable partout :** on montre la **coïncidence temporelle**,
jamais la **causalité**. Pas de flèche de tendance, pas de « détecté », pas de mise en
évidence automatique d'une zone. Deux couches, un axe commun, et le silence.

**Arbitrage à trancher : patient ou praticien ?** Un repère « changement de
traitement » posé sur la courbe d'humeur du patient reste factuel, mais il **invite**
à la mise en relation, ce qui est un pas vers l'auto-interprétation. Recommandation
prudente : **les couches croisées sont d'abord une fonctionnalité praticien (web)**.
Le patient ne voit que les repères qu'il a lui-même posés ou déclarés. À rediscuter,
mais à trancher explicitement.

---

## 3. Modèle conceptuel : ne raisonnez pas en « module x module »

Avec trente modules, la matrice des paires compte plus de 400 cases. Personne ne peut
la spécifier, et l'écrasante majorité des cases est vide de sens. **Le bon axe n'est
pas « quels modules croiser », c'est « que dépose chaque module sur un axe temporel
commun ».**

Vus sous cet angle, les modules se rangent en **quatre natures de signal** :

### 3.1 Les séries quotidiennes continues

Une valeur par jour, sur une échelle. C'est le seul matériau qui **se superpose**
vraiment.

`mood_tracker` (6 dimensions notées 1 à 10), `medication_side_effects` (sliders),
`sleep_diary` (durée, efficacité, fenêtre de sommeil), `chronobiology_tracker`
(régularité des rythmes), `medication_adherence` (statut quotidien),
`craving_journal` (intensité).

### 3.2 Les évènements datés ponctuels

Un fait, une date, pas de valeur continue. Ce sont les **repères**.

Changement de traitement, séance d'exposition (`fear_thermometer`), ouverture du plan
de crise (`crisis_plan`), exercice de respiration (`breathing_techniques`), ancrage
5-4-3-2-1 (`grounding`), saturation cognitive (`cognitive_saturation`), colonne de
Beck remplie (`beck_columns`), événement de vie déclaré.

### 3.3 Les mesures épisodiques

Des points espacés de plusieurs semaines, sur un instrument validé.

`phq9`, `gad7`, `bsl23`, `asrs6` / `asrs18`, `epds`, `nsi`, `rcads`, `snap_iv`,
`cssrs`.

### 3.4 Les outils de travail sans capteur

Ils ne mesurent rien dans le temps : ils produisent une compréhension ou une décision.

`psychoeducation`, `rim`, `decisional_balance`, `motivational_balance`,
`emotion_wheel` (production qualitative).

**La règle qui en découle :** on croise une **série continue** avec des **repères**,
ou **deux séries qui partagent le même pas de temps** (le jour). On ne croise pas deux
outils de travail entre eux. Les outils de travail ne contribuent à la timeline que
sous forme de **jalon daté** (« la balance décisionnelle a été posée le 12 »).

### 3.5 Le thermomètre de l'humeur est le fond de scène

Presque tous les croisements pertinents ont `mood_tracker` d'un côté. Ce n'est pas un
hasard : c'est **la seule série quotidienne multi-dimensionnelle du catalogue**. Elle
est le fond naturel sur lequel les autres modules viennent déposer leurs marques.

C'est aussi ce qui **sauve l'architecture** : au lieu d'un graphe de N x N liaisons, on
obtient une **timeline unique** où chacun dépose sans connaître les autres. Le
couplage reste linéaire.

---

## 4. Cartographie des croisements

### 4.1 Priorité haute, forte valeur clinique, coût raisonnable

**Observance x effets indésirables x humeur (la triade du traitement).**
C'est le croisement le plus riche du catalogue, et de loin. Cliniquement, la question
centrale des premières semaines d'un psychotrope est une question de **décalage
temporel** : les effets indésirables arrivent tôt, le bénéfice thymique arrive tard, et
c'est exactement dans cet intervalle que le patient arrête. Les trois données existent
déjà, dans trois modules qui s'ignorent. Les poser sur le même axe, avec le changement
de traitement en repère vertical, donne au praticien en une image ce qu'il reconstitue
péniblement à l'interrogatoire.
Modules : `medication_adherence`, `medication_side_effects`, `mood_tracker`.

**Sommeil x humeur x chronobiologie.**
Le paramètre le plus informatif à côté de l'humeur, et le plus précoce. Superposer la
fenêtre de sommeil et la régularité des rythmes aux dimensions humeur et énergie est
une lecture standard en consultation, en particulier dans le champ des troubles de
l'humeur où la régularité des rythmes sociaux est un objet thérapeutique en soi. Les
trois modules partagent déjà le pas quotidien : c'est le croisement le moins cher
techniquement.
Modules : `sleep_diary`, `chronobiology_tracker`, `mood_tracker`.

**Échelles validées x auto-suivi quotidien.**
Poser les points PHQ-9 et GAD-7 sur le fond de la courbe d'humeur quotidienne, c'est
littéralement du **Measurement-Based Care**, le seul de ces croisements qui ait une
littérature solide derrière lui. Le praticien voit d'un coup si l'instrument validé et
le ressenti quotidien racontent la même histoire. Quand ils divergent, la divergence
est elle-même une information de consultation.
Modules : `phq9`, `gad7`, `bsl23` (et les autres échelles) x `mood_tracker`.

**L'usage des outils de crise comme signal en soi.**
`grounding`, `breathing_techniques`, `cognitive_saturation`, `distress_tolerance`,
`crisis_plan` ne produisent presque aucune donnée. Mais **le fait d'y avoir eu
recours, à telle date, est une information clinique de premier ordre**. Six ancrages
en deux semaines, ce n'est pas une donnée physiologique, c'est un récit. Et c'est
quasi gratuit à produire : il suffit d'horodater l'usage. C'est le point le plus
sous-estimé de tout ce document : il transforme des modules muets en contributeurs de
la timeline pour un coût minimal.

### 4.2 Priorité moyenne, forte valeur, vigilance MDR accrue

**Activation comportementale x humeur.**
Le nombre d'activités réalisées et les scores de plaisir et de maîtrise, en regard des
dimensions plaisir et énergie. C'est le mécanisme théorique même de l'activation
comportementale, donc c'est passionnant à voir. C'est aussi **le croisement le plus
dangereux réglementairement**, parce qu'il appelle irrésistiblement la phrase « plus tu
bouges, mieux tu vas ». À faire, mais en affichant les deux couches sans jamais les
commenter, et probablement côté praticien seulement.
Modules : `behavioral_activation` x `mood_tracker`.

**Exposition graduée x anxiété quotidienne.**
Les SUD de chaque exposition sur le fond du niveau d'anxiété de base. Une habituation
se lit infiniment mieux quand on sait si la semaine était calme ou tendue.
Modules : `fear_thermometer` x `mood_tracker` (dimension anxiété).

**Craving x humeur x sommeil.**
Le craving est un phénomène affectivement modulé. En addictologie, « qu'est-ce qui
précédait l'envie » est le cœur du travail TCC, et cette question est aujourd'hui
laissée entièrement à la mémoire du patient.
Modules : `craving_journal` x `mood_tracker`, `sleep_diary`.

**Colonnes de Beck x humeur.**
La fréquence des colonnes remplies et l'évolution du degré de croyance, en regard des
jours d'humeur basse. Un travail cognitif intense les jours difficiles est un signe
d'appropriation de l'outil.
Modules : `beck_columns` x `mood_tracker`.

### 4.3 Repères de contexte, transverses à toutes les courbes

`cssrs` (dépistage suicidaire, posé par le praticien) et les **événements de vie**
déclarés sont des repères qui doivent pouvoir se poser sur n'importe quelle courbe,
**sans jamais déclencher quoi que ce soit d'automatique** (pas d'alerte, pas de mise en
évidence, pas de notification : ce serait un franchissement caractérisé de la ligne
MDR).

### 4.4 Ce qu'on ne croise pas, et pourquoi il faut le dire

`psychoeducation`, `rim`, `decisional_balance`, `motivational_balance` sont des
**outils de travail**, pas des capteurs. Leur seule contribution légitime à la timeline
est un **jalon daté**. Vouloir les croiser relèverait du fantasme du tout-connecté et
produirait du bruit. `emotion_wheel` est un cas limite : la granularité du vocabulaire
émotionnel est une donnée intéressante, mais elle est catégorielle, pas continue, et
son croisement demande une réflexion propre.

---

## 5. Architecture technique proposée

### 5.1 Le principe : une couche d'évènements, pas un couplage deux à deux

Le piège évident est de câbler les modules entre eux : l'observance qui connaît
l'humeur, le sommeil qui connaît l'anxiété. À trente modules, c'est une explosion
combinatoire et un couplage ingérable.

La forme proposée est l'inverse : **chaque module publie une projection de ses données
sous forme d'évènements neutres, sans savoir qui les consomme.** Un registre partagé
agrège ces projections. N'importe quel écran (le ruban du thermomètre, la page
Évolution du web, une future timeline praticien) consomme la même liste sans jamais
connaître les modules d'origine.

Les modules ne se parlent pas entre eux : **ils parlent tous à la même timeline.**

C'est le seul design qui tienne à l'échelle du catalogue, et il est structurellement
compatible avec la règle d'or : la couche **transporte des faits**, elle n'en dérive
rien.

### 5.2 Esquisse de contrat (à challenger, ce n'est pas figé)

Un évènement de timeline porterait, au minimum :

- une **date métier** (le jour concerné, pas l'instant de synchronisation) ;
- le **module d'origine** (`module_id`) ;
- une **nature** : série continue, repère ponctuel, mesure épisodique, jalon ;
- une **clé i18n** de libellé (jamais de texte en dur, règle projet) ;
- une **valeur** et une **échelle** optionnelles, pour les séries ;
- un **type** optionnel, pour les repères (traitement, événement de vie, autre).

Le registre vivrait dans `packages/shared` (les deux plateformes le consomment). Deux
**adaptateurs** en dériveraient : côté mobile, la projection lit les tables SQLite du
module ; côté web, elle lit `patient_entries`. Le contrat, lui, est unique. C'est la
condition de la parité web / mobile, qui est une règle du projet.

### 5.3 Ce qui existe déjà et sert de tête de pont

Le module `mood_tracker` possède déjà des **repères typés** (`mood_markers`, avec un
champ `type` à valeurs `treatment` / `life_event` / `other`, en cours de spécification
dans l'issue #161). C'est, sans que ç'ait été conçu pour, **la première brique de la
timeline**. Le premier pas concret consiste à **alimenter automatiquement ces repères
depuis d'autres modules** plutôt qu'à la main. Coût faible, valeur immédiate, et test
grandeur nature de toute l'idée.

---

## 6. Difficultés techniques : les constats vérifiés dans le code

Cette section est la plus importante du document. Les trois obstacles ci-dessous sont
**invisibles dans une maquette** et **bloquants pour la fonctionnalité**. Ils ont été
vérifiés dans le code, pas supposés.

### 6.1 Bloquant : la date métier ne voyage pas jusqu'au serveur

Superposer deux courbes n'a de sens que si les deux datent leurs entrées de la même
façon. Or aujourd'hui, la date métier d'une saisie remonte au serveur de façon
**hétérogène, et parfois pas du tout**.

Le mécanisme existe pourtant : `apps/mobile/src/services/syncHelpers.ts` permet
désormais de surcharger `client_created_at` (correctif issu d'un incident sur la
chronobiologie, où une saisie rétroactive apparaissait à deux jours différents sur
mobile et sur web). **Mais un seul service l'utilise** : `formEntryService.ts`. Tous
les autres laissent l'horodatage par défaut, c'est-à-dire **l'instant de
synchronisation**.

Le cas le plus problématique est `scaleEntryService.ts`, qui porte **l'humeur et toutes
les échelles cliniques** : le payload synchronisé contient `scale_id`, `answers`,
`total_score` et `subscale_scores`, et **aucune date**. La date de saisie éditable par
le patient (`entry_date`, prévue dans la refonte du thermomètre) existe donc en local
et **se perd à la synchronisation**. Une saisie du dimanche rattrapée le mardi
apparaîtra au mardi côté praticien.

**Conséquence directe :** tant que ce point n'est pas réglé, toute superposition de
courbes est fausse d'un ou deux jours dans un cas sur deux. Et un décalage d'un jour,
dans une lecture de latence d'action d'un traitement, ruine l'intérêt entier de la
fonctionnalité.

**C'est le vrai chantier fondateur.** Il est peu spectaculaire, il ne se voit sur
aucune maquette, et rien de sérieux ne peut être construit avant lui.

### 6.2 Bloquant : les changements de traitement ne sont pas historisés

L'exemple le plus intuitif de la fonctionnalité, « un point qui marque le changement de
traitement sur la courbe d'humeur », bute sur un fait simple : **cette donnée n'existe
pas.**

La liste des molécules vit dans `patient_modules.config.medications`, un `jsonb` que le
praticien édite **en place**. Quand il le modifie, l'ancienne version est **écrasée**.
Il n'y a ni date de changement, ni valeur précédente, ni historique. Le journal d'audit
RGPD (`access_audit_log`) ne sauve pas la situation : par conception, il n'enregistre
que des **métadonnées techniques** (qui, quand, quelle table), **jamais les valeurs**.

Le même problème vaut pour les activités co-construites de l'activation comportementale
(`config.ba_activities`) et pour les effets suivis (`config.tracked_effects`).

**Il faut donc décider d'un mécanisme d'historisation des configurations de module.**
Plusieurs pistes, à arbitrer : une table d'historique dédiée, une table
`module_config_versions` générique, ou des évènements de configuration horodatés. C'est
un choix structurant, et il déborde largement du croisement de modules : c'est aussi ce
qui permettrait de répondre à « qu'est-ce que ce patient prenait en mars ? ».

### 6.3 Structurel : des stockages hétérogènes par nature

Chaque module a son propre stockage local : `scale_entries`, `sleep_diary_entries`,
`form_entries`, `activity_records`, `chrono_entries`, `daily_entries`,
`medication_intakes`, `fear_entries`, `tree_selections`, `plan_items`. C'est un choix
sain (chaque module a son schéma), mais il implique que **la timeline ne peut pas être
une simple requête** : elle doit passer par des **projections par module**, une par
source. C'est du travail linéaire (une projection par module contributeur), pas du
travail exponentiel, mais c'est du travail réel.

### 6.4 Points de vigilance secondaires

- **Fuseau horaire.** Une date métier locale ne doit jamais passer par
  `toISOString()`, qui bascule en UTC et décale d'un jour en fuseau positif (donc en
  France). Le projet a déjà connu deux incidents de ce type. Une timeline est
  précisément l'endroit où un décalage d'un jour est le plus destructeur.
- **Consentement et RGPD.** Croiser des données de santé les rend **plus
  identifiantes et plus sensibles**, même si chaque donnée prise isolément était déjà
  couverte par le consentement de partage (`patients.share_consent`). Rien à changer
  sur le plan juridique a priori (les données sont déjà partagées avec le praticien),
  mais la question mérite d'être posée au référent.
- **Volumétrie et performance.** Une timeline sur douze mois avec six modules actifs
  reste modeste (quelques milliers de points). Ce n'est pas un sujet à court terme,
  mais la projection doit être bornée par une période, pas charger tout l'historique.
- **Offline.** Côté mobile, la timeline doit se construire depuis SQLite, donc
  fonctionner hors ligne. C'est le comportement naturel de l'architecture proposée, à
  condition de ne pas être tenté de calculer la timeline côté serveur.
- **Densité visuelle.** Superposer six couches sur un même axe produit vite une
  bouillie illisible. La règle « le praticien choisit ce qu'il empile » est autant une
  contrainte réglementaire qu'une nécessité de lisibilité.

---

## 7. Réalisation possible, par lots

Ce découpage est une **proposition d'ordre**, pas un engagement de calendrier. Il est
construit pour que **chaque lot produise de la valeur seul**, et pour que les lots
fondateurs, ingrats, soient faits avant les lots visibles.

**Lot 0, fondations (prérequis absolu, aucune valeur visible).**
Fiabiliser la date métier de bout en bout : chaque service mobile qui écrit une entrée
patient transmet la date du jour concerné jusqu'à `patient_entries`. Vérifier la parité
mobile / web sur un module témoin. Sans ce lot, tout le reste est faux.

**Lot 1, historisation des configurations.**
Décider et implémenter le mécanisme qui date les changements de traitement (et, par
extension, tout changement de configuration de module). Sans ce lot, le repère
« changement de traitement » n'existe pas.

**Lot 2, la couche d'évènements.**
Définir le contrat, le registre partagé, et les deux adaptateurs (SQLite mobile,
`patient_entries` web). Le brancher sur **un seul** module contributeur pour valider le
design.

**Lot 3, premier croisement bout en bout.**
Alimenter automatiquement les repères typés du thermomètre depuis le module
d'observance. C'est le premier résultat visible, et c'est le test grandeur nature de
toute l'idée.

**Lot 4, horodatage de l'usage des outils.**
Faire émettre un évènement aux modules aujourd'hui muets (ancrage, respiration,
saturation cognitive, plan de crise). Coût faible, valeur clinique élevée.

**Lot 5, la timeline praticien (web).**
L'écran où le praticien empile les couches de son choix. C'est l'aboutissement visible
du travail, et il ne peut pas être fait en premier.

**Lot 6, les séries croisées.**
Sommeil, chronobiologie, échelles validées, activation comportementale, craving,
exposition, sur le fond de l'humeur.

---

## 8. Opportunités ouvertes par cette architecture

- **Le Measurement-Based Care devient natif.** Superposer les échelles validées à
  l'auto-suivi quotidien est exactement la pratique dont la littérature montre le
  bénéfice, et que moins d'un praticien sur cinq applique faute d'outil. C'est un
  argument fort, y compris hors du produit (appels à projets, incubateurs).
- **La consultation gagne un support.** Une timeline, c'est un objet qu'on regarde
  **à deux**, patient et praticien, pendant la séance. C'est un usage très différent
  d'un tableau de bord qu'on consulte seul, et c'est cohérent avec le positionnement du
  produit (les échelles sont remplies en consultation, pas en autonomie).
- **La synthèse de suivi.** Une fois la timeline existante, produire un export ou un
  compte rendu de période (données brutes, sans interprétation) devient presque
  gratuit. C'est un besoin réel des praticiens et un candidat naturel à une évolution
  ultérieure.
- **L'historisation des configurations a une valeur propre**, indépendante du
  croisement : elle répond à « qu'est-ce que ce patient prenait en mars », qui est une
  question de dossier médical, pas de data-viz.
- **La porte du niveau 3 reste ouverte.** Si un jour une démarche de marquage CE est
  engagée, l'architecture en couche d'évènements est exactement ce sur quoi une analyse
  se brancherait. On ne se ferme rien, on choisit de ne pas y aller maintenant.

---

## 9. Risques et non-objectifs

- **Le risque principal n'est pas technique, il est réglementaire.** La pente vers le
  niveau 3 est glissante et séduisante. Chaque écran de croisement devra être relu avec
  la règle d'or en main.
- **Le deuxième risque est le sur-engagement.** L'architecture proposée est simple,
  mais les lots 0 et 1 sont de la dette technique pure, sans effet visible. La tentation
  sera de les sauter pour aller à l'écran joli. Ce serait construire la timeline sur des
  dates fausses.
- **Non-objectifs assumés :** aucune corrélation calculée, aucune alerte, aucune
  notification conditionnée par les données croisées, aucun score composite, aucune mise
  en évidence automatique.

---

## 10. Questions ouvertes, à trancher ensemble

1. **Historisation des configurations** : table dédiée, table générique de versions, ou
   évènements horodatés ? C'est le choix le plus structurant du document.
2. **Couche d'évènements** : accord de principe sur une projection publiée par chaque
   module vers un registre partagé, plutôt qu'un couplage direct entre modules ?
3. **Date métier** : validons-nous le lot 0 comme prérequis non négociable, y compris
   s'il retarde les écrans visibles ?
4. **Patient ou praticien** : les couches croisées sont-elles réservées au web
   praticien dans un premier temps ?
5. **Périmètre du premier jalon** : est-ce que « observance vers repères du thermomètre »
   est le bon premier croisement, ou en préférez-vous un autre ?

---

## Annexe : références de code citées

| Constat | Fichier |
|---|---|
| Surcharge possible de la date de synchronisation | `apps/mobile/src/services/syncHelpers.ts` |
| Seul service qui transmet la date métier | `apps/mobile/src/services/formEntryService.ts` |
| Humeur et échelles synchronisées sans date | `apps/mobile/src/services/scaleEntryService.ts` |
| Configuration de module écrasée en place | `supabase/schema.sql`, table `patient_modules`, colonne `config` |
| Journal d'audit sans valeurs | `supabase/schema.sql`, `fn_audit_write` et `access_audit_log` |
| Repères typés du thermomètre (tête de pont) | Issue #161, table SQLite `mood_markers` |
| Inventaire des modules et de leurs stockages | `docs/modules.md` |
