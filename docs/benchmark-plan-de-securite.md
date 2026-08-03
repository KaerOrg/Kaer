# Benchmark concurrentiel : plan de sécurité

> **À quoi sert ce document.** Comparer, écran par écran et sur des critères fixés à
> l'avance, le module « Mon plan de sécurité » de Kær aux deux applications françaises
> qui couvrent le même besoin : **Jardin Mental** (Assurance Maladie + Fabrique
> numérique des ministères sociaux) et **Hop ma liste** (CHU d'Angers).
>
> Il ne s'agit pas de faire un état de l'art clinique : celui-ci existe déjà dans
> l'audit du 29 juillet 2026 (constats `K-01` à `K-40`), et les critères ci-dessous en
> sont directement dérivés. Il s'agit de **remplacer une inquiétude par des faits
> mesurés**, et d'en tirer trois décisions produit.
>
> Date de la passe : ................ · Testeur : ................

---

## 0. Protocole de test

**Durée : environ 90 minutes.** À faire d'une traite, sur un seul téléphone, dans cet
ordre. Ne pas lire les descriptions des stores avant : on teste l'usage réel, pas la
promesse marketing.

**Matériel**

- Un téléphone (iOS ou Android) avec Kær installé en version de la branche courante.
- Jardin Mental : [App Store](https://apps.apple.com/fr/app/jardin-mental/id1540061393) · [Google Play](https://play.google.com/store/apps/details?id=com.monsuivipsy)
- Hop ma liste : [App Store](https://apps.apple.com/fr/app/hop-ma-liste/id1609950413) · [Google Play](https://play.google.com/store/apps/details?id=fr.studit.Hop_ma_liste)
- Un chronomètre (celui du téléphone suffit, ou une montre).

**Déroulé, identique pour les trois applications**

1. **Installation et premier lancement.** Chronométrer le temps entre l'ouverture de
   l'app et le premier écran où l'on peut écrire quelque chose dans son plan.
   Noter tout ce qui est demandé au passage : compte, email, âge, consentement.
2. **Construction du plan.** Remplir un plan complet et réaliste, une entrée par
   étape. Utiliser du contenu vraisemblable, pas « test » ni « aaa » : c'est le seul
   moyen de voir comment l'application se comporte avec du vrai texte.
3. **Parcours de crise.** Verrouiller le téléphone, le poser, attendre dix secondes.
   Puis se remettre en situation : « il est 3 h du matin, je vais mal, j'ouvre mon
   téléphone ». Chronométrer et **compter les interactions** (appuis, scrolls, choix)
   jusqu'à avoir la première étape de son plan personnel sous les yeux.
4. **Test hors ligne.** Activer le mode avion. Fermer complètement l'application.
   La rouvrir. Le plan est-il lisible en entier ? Les boutons d'appel fonctionnent-ils ?
5. **Test de sortie.** Chercher : export, partage, impression, envoi au médecin.
6. **Test de confidentialité.** Chercher : verrouillage par code ou biométrie,
   masquage du contenu, mention de l'endroit où sont stockées les données.
7. **Test d'accessibilité minimal.** Passer la taille de police du système au
   maximum, rouvrir l'écran du plan. Le contenu est-il coupé ?
8. **Désinstaller** et noter ce qu'il advient des données.

**Règle de cotation**, utilisée dans toutes les grilles :

| Code | Signification |
|---|---|
| **✓** | Présent et fait correctement |
| **~** | Présent mais partiel, mal exécuté, ou difficile à trouver |
| **✗** | Absent |
| **?** | Pas vérifiable dans les conditions du test |
| **NA** | Sans objet pour ce produit |

La colonne **Kær** se remplit avec le même barème et la même honnêteté que les deux
autres. Une grille où Kær coche tout n'a aucune valeur d'aide à la décision.

---

## 1. Fiche d'identité (pré-remplie, à corriger si besoin)

| | **Kær** | **Jardin Mental** | **Hop ma liste** |
|---|---|---|---|
| Éditeur | Kær | Caisse Nationale d'Assurance Maladie + Fabrique numérique des ministères sociaux | CHU d'Angers (psychiatrie et addictologie) |
| Lancement | Non sorti | 2020 (ARS Île-de-France), repris par la CNAM en 2025 | 2022 |
| Modèle | Praticien invite le patient, modules débloqués en consultation | Grand public, libre téléchargement | Grand public, libre téléchargement |
| Compte utilisateur | Oui (invitation praticien) | **Non, aucune inscription** | Non, anonyme |
| Stockage des données | SQLite local + Supabase (sync consentie) | **Uniquement sur le téléphone** | À vérifier |
| Prix | À définir | Gratuit | Gratuit |
| Code source | Privé | Ouvert (Apache-2.0, `SocialGouv/jardinmental`) | Fermé |
| Périmètre | 30+ modules, dont plan de sécurité | Suivi quotidien, journal, traitement, outil TCC, ressources, **plan de crise**, directives anticipées | 4 modules : liste d'urgence, boîte personnelle, journal, ressources |
| Traction publique connue | 0 | 4,2/5 sur 36 avis App Store | ~9 000 téléchargements (2024), 4,4/5 sur 20 avis |
| Face praticien | **Oui, web complet** | Non (export PDF montré par le patient) | Non |

**Nom du module.** Jardin Mental appelle le sien « plan de crise ». Kær doit passer à
« plan de sécurité » (constat `K-07`) : c'est le terme de la recommandation HAS 2021,
et cela évite en plus de porter le même nom qu'un concurrent institutionnel.

---

## 2. Grille A : couverture clinique du plan (Stanley & Brown 2012)

Le référentiel est le protocole canonique en six étapes, plus la septième étape
optionnelle du template officiel. La question posée est : **l'étape existe-t-elle, et
pose-t-elle la bonne question ?** Une étape présente mais dont le libellé parle d'autre
chose compte `~`, pas `✓` (c'est exactement le défaut `K-01` de Kær).

| # | Étape | Kær | Jardin Mental | Hop ma liste | Notes |
|---|---|---|---|---|---|
| 1 | Signes d'alerte (*warning signs*) | | | | |
| 2 | Stratégies internes, seul (*internal coping*) | | | | |
| 3 | Personnes et lieux qui distraient, **sans avoir à dire que ça va mal** | | | | |
| 4 | Personnes à qui demander de l'aide **en disant que ça va mal** | | | | |
| 5 | Professionnels et services à contacter | | | | |
| 6 | Sécurisation de l'environnement (moyens létaux) | | | | |
| 7 | Raisons de vivre (étape optionnelle) | | | | |

**Sous-questions décisives**, à cocher séparément :

| Critère | Kær | JM | HML | Notes |
|---|---|---|---|---|
| La distinction étape 3 / étape 4 est **lisible dans le libellé** (`K-11`) | | | | |
| L'étape 6 est **structurée** (quoi, quelle action, qui détient, quand, vérifié) et pas un champ libre | | | | |
| L'application **ne nomme, ne liste et ne suggère aucun moyen létal** | | | | |
| Le plan est rédigé à la **première personne** (« je »), sans bascule au « tu » (`K-14`) | | | | |
| Les items d'une étape peuvent être **réordonnés** (le plan est une liste hiérarchisée, `K-34`) | | | | |
| Une **bibliothèque de suggestions** aide à remplir un champ vide (`K-12`) | | | | |
| Si oui : la bibliothèque est-elle **statique et identique pour tous**, ou filtrée selon les saisies ? | | | | |

> La dernière ligne est aussi une observation réglementaire : une bibliothèque filtrée
> selon les saisies du patient est un critère de bascule en dispositif médical
> (MDCG 2019-11 Rev.1). Voir la grille G.

---

## 3. Grille B : exécution en crise

**C'est la grille la plus importante du document.** L'audit identifie l'absence de mode
crise comme le constat structurant (`K-02`), et note que le seul produit au monde à
implémenter un parcours guidé distinct est Jaspr Health, un produit hospitalier
américain hors marché français. Cette grille vérifie si c'est toujours vrai.

| Critère | Kær | JM | HML | Notes |
|---|---|---|---|---|
| **Temps** écran verrouillé → première étape du plan personnel (secondes) | | | | |
| **Nombre d'interactions** sur le même trajet (cible : ≤ 2) | | | | |
| Il existe un **mode crise distinct** du mode édition | | | | |
| Le mode crise est en **lecture seule stricte** (aucun champ, aucune suppression) | | | | |
| Une **décision par écran**, en typographie large | | | | |
| Une **séquence imposée**, avec « ça n'a pas suffi → étape suivante » | | | | |
| Le mode crise affiche le **contenu personnel du patient**, pas des contenus génériques | | | | |
| Sortie possible **à tout moment**, sans confirmation | | | | |
| **Actions directes** depuis le plan : appeler, envoyer un SMS | | | | |
| Une **amorce de conversation** écrite par le patient est rappelée (`K-04`) | | | | |
| Un **repli explicite** si le contact ne répond pas | | | | |
| Une **clôture** du parcours, sans question évaluative ni score (`K-38`) | | | | |
| Les **actions destructives** (poubelle) sont inatteignables en crise (`K-03`) | | | | |
| Toute suppression est **annulable** | | | | |
| **Raccourci d'accès rapide** : widget, action longue sur l'icône, écran verrouillé (`K-36`) | | | | |

**Verdict de la grille B**, à écrire en une phrase après le test :

> ................................................................................

---

## 4. Grille C : disponibilité, robustesse, sortie du plan

L'audit classe le hors ligne en S1 (`K-05`) : les moments où le plan est le plus
nécessaire coïncident avec les moments où le réseau manque. C'est aussi le point où
l'architecture « tout local » de Jardin Mental lui donne un avantage structurel.

| Critère | Kær | JM | HML | Notes |
|---|---|---|---|---|
| Le plan est **intégralement lisible en mode avion** | | | | |
| Lisible en mode avion **dès la première ouverture après installation** | | | | |
| Aucun spinner, aucun écran blanc dans le chemin de lecture | | | | |
| Les boutons d'appel fonctionnent hors ligne | | | | |
| **Export PDF** d'une page, imprimable (`K-35`) | | | | |
| **Partage** explicitement consenti vers un soignant ou un proche | | | | |
| **Historique des versions** du plan (`K-37`) | | | | |
| **Date de création et de dernière révision** visible (`K-10`) | | | | |
| Signalement **descriptif** des sections vides, jamais évaluatif | | | | |
| Rappel de révision : existe-t-il ? à quelle fréquence ? conditionnel ou fixe ? | | | | |
| Le contenu **survit** à une désinstallation / réinstallation | | | | |
| Le contenu **survit** à un changement de téléphone | | | | |

> Les deux dernières lignes sont l'angle mort de l'architecture locale de Jardin
> Mental : sans compte, un changement de téléphone fait probablement perdre le plan.
> Si c'est confirmé, c'est un argument commercial direct pour Kær auprès des soignants.

---

## 5. Grille D : face soignante et co-construction

C'est la grille où Kær est censé être seul. L'audit note que la revue JMIR 2024
identifie la co-construction tracée comme **absente** des applications existantes, et
que les seuls produits à avoir une véritable face soignante sont BRITEPath et Jaspr,
deux dispositifs de recherche américains. **Si une case de cette grille se coche chez
un concurrent, c'est le signal le plus important de tout le benchmark.**

| Critère | Kær | JM | HML | Notes |
|---|---|---|---|---|
| Le soignant a un **accès**, sous une forme quelconque | | | | |
| Le soignant peut **préparer ou amender** le plan | | | | |
| Le plan porte une trace de **qui l'a élaboré** et **quand** | | | | |
| Distinction d'auteur item par item (patient / soignant) (`K-09`) | | | | |
| Le soignant voit **ce qui a changé** depuis la dernière consultation | | | | |
| Le soignant peut **débloquer ou retirer** le module | | | | |
| Le patient peut **choisir ce qu'il partage**, section par section | | | | |
| Le plan existe dans un **parcours de soin**, pas seulement dans un téléphone | | | | |
| L'application est **prescriptible** : un soignant peut l'inscrire dans sa pratique | | | | |

**Question de synthèse.** Après le test, répondre honnêtement : *un praticien qui veut
voir et réviser le plan de son patient a-t-il aujourd'hui une autre solution que Kær ?*

> ................................................................................

---

## 6. Grille E : ressources d'urgence

Critères dérivés de `K-06`. Le paysage bouge vite (3040 étudiants lancé le 1er juillet
2026, convention 3114/3018 en mai 2026), donc on vérifie aussi si les numéros sont à
jour.

| Critère | Kær | JM | HML | Notes |
|---|---|---|---|---|
| **15 ou 112** présent | | | | |
| **3114** présent | | | | |
| **114** présent (sourds, malentendants, aphasiques) | | | | |
| Chaque ressource porte un libellé disant **à qui elle s'adresse** et sa disponibilité | | | | |
| Le fait que le 3114 est **gratuit, 24h/24 et ouvert à l'entourage** est dit | | | | |
| La **hiérarchie** entre les numéros est lisible (risque vital vs détresse) | | | | |
| L'accès d'urgence est disponible **depuis toutes les vues**, y compris l'accueil | | | | |
| L'accès d'urgence n'est **pas bloqué** par un éventuel verrouillage | | | | |
| Les numéros semblent **à jour** | | | | |
| La barre d'urgence **ne coupe pas** le contenu de la page (`K-08`) | | | | |
| Autres ressources proposées (3018, 3040, SOS Amitié, associations) : lesquelles ? | | | | |

---

## 7. Grille F : public adolescent, confidentialité, accessibilité

| Critère | Kær | JM | HML | Notes |
|---|---|---|---|---|
| L'application déclare un **âge minimum** | | | | |
| Existence d'un **registre adapté** à l'adolescent | | | | |
| Un **volet destiné aux parents** ou à un adulte de confiance | | | | |
| Le partage avec un adulte est **choisi par le jeune**, section par section | | | | |
| **Verrouillage** biométrique ou par code, optionnel (`K-16`) | | | | |
| Le verrouillage **ne bloque pas** l'accès aux ressources d'urgence | | | | |
| Le lieu de stockage des données est **dit en langage clair** (`K-39`) | | | | |
| Un **disclaimer de non-dispositif-médical** est visible (`K-40`) | | | | |
| Le layout **tient** à la taille de police système maximale (`K-15`) | | | | |
| Les questions ne sont **pas en gris clair italique** | | | | |
| L'information n'est jamais portée par la **seule couleur** | | | | |
| Une **synthèse vocale** ou une navigation par icônes est proposée | | | | |

---

## 8. Grille G : où les concurrents placent la frontière dispositif médical

Cette grille n'est pas une grille de fonctionnalités : c'est de la veille
réglementaire. Jardin Mental est adossé à l'Assurance Maladie et peut se permettre des
arbitrages que Kær ne peut pas se permettre. **Observer ce qu'ils s'autorisent renseigne
sur l'état de la doctrine, mais ne constitue jamais une autorisation pour Kær.**

| Observation | JM | HML | Ce que ça dit |
|---|---|---|---|
| L'application **interprète** une donnée saisie (tendance, seuil, commentaire) | | | |
| L'application **alerte** en fonction d'un contenu ou d'un score | | | |
| Les suggestions sont **filtrées ou classées** selon les saisies | | | |
| Une **notification** est déclenchée par la donnée (et pas par un horaire fixe) | | | |
| L'application affiche un **score de qualité** du plan | | | |
| Vocabulaire employé : « prévention du suicide », « réduit le risque », « thérapeutique » ? | | | |
| Un **marquage CE** ou une mention de dispositif médical apparaît | | | |

> Rappel de la ligne Kær, formulée dans l'audit : *l'application peut structurer,
> stocker, restituer et rappeler ; elle ne peut ni évaluer, ni classer, ni choisir, ni
> alerter.*

---

## 9. Grille H : friction d'entrée et qualité perçue

C'est là que Kær est structurellement désavantagé, et il vaut mieux le mesurer que le
découvrir en démonstration devant un praticien.

| Critère | Kær | JM | HML | Notes |
|---|---|---|---|---|
| Temps installation → premier écran utile (secondes) | | | | |
| Nombre d'informations demandées avant de pouvoir écrire | | | | |
| Une **inscription** est nécessaire | | | | |
| Un **tiers** (praticien) est nécessaire pour commencer | | | | |
| Un **état vide travaillé** explique ce qu'est un plan de sécurité (`K-31`) | | | | |
| Le vocabulaire est celui du patient, pas celui du soignant (`K-26`, `K-27`) | | | | |
| Qualité perçue générale, note sur 10 | | | | |
| Ce qui frappe le plus, en une phrase | | | | |

---

## 10. Synthèse : les trois décisions à sortir de ce test

À remplir **le jour même**, pendant que l'impression est fraîche.

### Décision 1 : sur quoi Kær ne se bat plus

Lister les fonctions où Jardin Mental fait déjà correctement le travail, gratuitement
et sans inscription. Kær ne gagnera pas là. Ce ne sont pas des fonctions à supprimer,
ce sont des fonctions à **ne plus prioriser**.

> ................................................................................

### Décision 2 : les trois écarts à creuser en priorité

Les trois lignes des grilles B et D où Kær est seul à cocher `✓`, ou seul à pouvoir le
cocher. Ce sont elles, et elles seules, qui doivent porter le pitch et la roadmap.

1. ................................................................................
2. ................................................................................
3. ................................................................................

### Décision 3 : le retard à combler avant toute mise en main patient

Les lignes où un concurrent coche `✓` et Kær `✗` **sur un critère de sécurité**
(grilles B, C, E). Ce sont des bloquants, pas des améliorations.

1. ................................................................................
2. ................................................................................
3. ................................................................................

---

## 11. Signaux à surveiller dans le temps

À revérifier tous les trimestres. Chacun de ces signaux, s'il apparaît, change
l'analyse concurrentielle et justifie de refaire une passe complète du benchmark.

| Signal | Où le vérifier | Ce que ça signifierait | Vu le |
|---|---|---|---|
| Jardin Mental introduit une **inscription** ou un compte | Page d'accueil du site, onboarding de l'app | La barrière structurelle qui les empêche d'avoir une face soignante tombe. Alerte maximale. | |
| Jardin Mental ouvre un **espace professionnel** | `jardinmental.fabrique.social.gouv.fr`, dépôt GitHub | Concurrence frontale sur le cœur de Kær | |
| Jardin Mental ajoute un **partage soignant** autre que le PDF | Notes de version des stores | Début de chevauchement | |
| Un **partenariat formel** Jardin Mental × Hop ma liste est annoncé | Sites CHU Angers et Fabrique numérique, LinkedIn | Consolidation de l'offre publique sur le plan de sécurité | |
| Un **éditeur de logiciel de cabinet** ajoute des modules patients | Presse professionnelle, salons | La vraie menace concurrentielle : même modèle, moyens supérieurs | |
| Une startup privée annonce une **face praticien** sur ce créneau | Presse santé numérique, levées de fonds | Idem | |
| Le **3114** ouvre un canal SMS ou tchat accessible | Contact direct avec le 3114 | Débloque `K-06` côté accessibilité | |
| Évolution des numéros nationaux (nouveau numéro, fusion) | Santé publique France | Les coordonnées en configuration doivent être mises à jour | |

---

## 12. Ce que ce benchmark ne mesure pas

À garder en tête pour ne pas sur-interpréter les résultats.

- **La distribution.** Jardin Mental bénéficie de la caution Assurance Maladie et de la
  Grande cause nationale santé mentale 2026. Aucune grille fonctionnelle ne compense
  cela, et ce n'est pas sur ce terrain que Kær se place.
- **L'usage réel.** Une fonction cochée `✓` n'est pas une fonction utilisée. Les données
  publiques disponibles suggèrent une traction modeste des deux concurrents (36 et 20
  avis, environ 9 000 téléchargements), mais ce ne sont pas des mesures d'usage.
- **La qualité clinique du contenu**, qui demande une lecture par un clinicien formé au
  plan de sécurité, pas un test d'usage.
- **La trajectoire.** Ce document photographie un état. Il vaut par sa répétition
  trimestrielle, pas par sa première passe.

---

## Références

- Audit interne : « Kær, module Plan de crise, critique détaillée », 29 juillet 2026 (constats `K-01` à `K-40`)
- Reprise de chantier : [`handoff/2026-07-31-plan-de-securite.md`](handoff/2026-07-31-plan-de-securite.md)
- Module Kær : [`modules/crisis_plan.md`](modules/crisis_plan.md)
- Jardin Mental : [site officiel](https://jardinmental.fabrique.social.gouv.fr/) · [fiche Fabrique numérique](https://www.fabrique.social.gouv.fr/nos-startups/jardin-mental) · [code source](https://github.com/SocialGouv/jardinmental)
- Hop ma liste : [présentation CHU d'Angers](https://www.chu-angers.fr/offre-de-soins/acteur-de-sante-publique/hop-ma-liste-134448.kjsp)
- Stanley B. & Brown G. K. (2012) : Safety Planning Intervention, *Cognitive and Behavioral Practice*
- HAS (septembre 2021) : Idées et conduites suicidaires chez l'enfant et l'adolescent
