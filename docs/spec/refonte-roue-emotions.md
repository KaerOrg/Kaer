# Refonte — Roue des émotions (`emotion_wheel`)

> Document de conception, version 2. Statut : **en discussion, avant implémentation**.
> Branche : `refonte/roue-des-emotions`. Aucune ligne de code applicatif tant que la
> taxonomie ci-dessous n'est pas validée par le clinicien.
>
> La v1 proposait une taxonomie inventée présentée à tort comme « evidence-based ».
> Cette v2 corrige le tir : ancrage sur un outil clinique réel, cadrage honnête de la
> preuve, et correction des défauts structurels identifiés en revue.

## 1. Ce que cette refonte corrige

Le module `emotion_wheel` est `coming_soon` (jamais sorti). Il portait une taxonomie
Plutchik (8 primaires, couronnes d'intensité). La v1 de refonte a remplacé ça par une
roue de type Willcox, mais inventée et mal cadrée. Défauts identifiés et corrigés ici :

| Défaut v1 | Correction v2 |
|---|---|
| Taxonomie inventée, étiquetée « Willcox adapté » | Ancrage explicite sur la Feeling Wheel publiée (Willcox 1982 + extension Roberts), écarts documentés (§ 5). |
| « Evidence-based » appliqué à la taxonomie | Preuve recadrée : le **mécanisme** est étayé, **l'instrument** est un outil clinique reconnu, **non** validé psychométriquement (§ 2). |
| Sous Peur : `Appréhension < Anxiété < Panique` = échelle d'intensité déguisée (le défaut même reproché à Plutchik) | Nuances de Peur rendues **qualitatives** ; l'intensité passe sur le curseur séparé (§ 6). |
| Culpabilité absente (trou majeur en TCC) | Famille **Honte et culpabilité** ajoutée (§ 5.6). |
| Honte enfouie dans Dégoût | Honte déplacée dans sa famille propre ; Dégoût nettoyé. |
| Frontières floues, ontologie mêlée (« Confusion » = état cognitif, « Jalousie » = mélange) | Familles redéfinies, nuances homogènes, distinctions explicitées (§ 5, § 7). |

## 2. Cadrage honnête de la preuve

Distinction qui doit rester nette pour un relecteur expert :

- **Le mécanisme est solidement étayé.** Nommer une émotion réduit la réactivité
  amygdalienne (affect labeling, Lieberman) ; la **précision** du label est l'ingrédient
  actif ; la **granularité** émotionnelle (Barrett) est associée à une meilleure
  régulation et **s'entraîne par la répétition** ; l'alexithymie répond aux
  interventions ciblant l'identification des émotions.
- **L'instrument (la roue) n'est pas un outil psychométrique validé.** La Feeling Wheel
  de Willcox est un support de psychoéducation largement utilisé en TCC/DBT/ACT, **sans**
  étude de validation (fidélité, validité de construit). C'est un **échafaudage de
  vocabulaire**, pas une échelle de mesure. C'est précisément son rôle ici, et c'est
  légitime tant qu'on ne le présente pas comme un BDI.
- **La seule roue réellement validée est la Geneva Emotion Wheel** (Scherer et al.,
  2013 ; axes valence × activation × pouvoir ; validée en interculturel). Elle est un
  outil de **cotation**, pas de **découverte du mot juste**. Documentée ici comme
  alternative (§ 9), au cas où une version « recherche » serait souhaitée un jour.

Conclusion : la roue n'a pas besoin d'être validée psychométriquement, parce qu'elle
n'est pas une mesure. Le choix précis des mots relève du **jugement clinique**, pas
d'une vérité dérivée de la preuve. Ce document garantit la **rigueur structurelle** ;
le dernier mot sur le vocabulaire revient au clinicien.

## 3. Décisions verrouillées

| # | Sujet | Décision |
|---|---|---|
| 6 | Stratégie produit | **A — outil pur et conforme** : labelliser + contexte + historique neutre. Pas de hub, pas de suggestion de stratégie. |
| 1 | Public | Adulte (alexithymie, TCC) **et** ado (mode teen). |
| 2 | Profondeur | 3 niveaux **qualitatifs**, profondeur **libre** (s'arrêter au niveau 1 ou 2 est valide). |
| 3 | Tag de contexte | **Oui** : chips de contexte neutres + note libre. |
| 4 | Périmètre | A. |
| 5 | Intensité | Curseur **1 à 10 brut, séparé, optionnel**. Sans label, sans couleur de seuil. |
| 7 | Ossature lexicale | Feeling Wheel (Willcox 1982 + Roberts), écarts cliniques documentés. |

**À trancher** : (a) garder **Dégoût** et **Honte et culpabilité** comme familles
distinctes (mon choix, voir § 5) ou les fondre ; (b) ajouter ou non **Surprise**
(volontairement écartée : valence neutre, transitoire, peu centrale en clinique).

## 4. Conformité MDR 2017/745

- Couleurs de la roue = **identité de famille** (joie, peur…), jamais une gravité
  clinique. Conforme.
- Intensité = **chiffre brut**, sans label ni couleur de seuil.
- Historique = liste chronologique neutre. **Aucune** tendance, flèche, comparaison,
  ni lecture évolutive.
- Tag de contexte = donnée brute restituée telle quelle, jamais interprétée.
- **Aucune** stratégie de régulation suggérée selon l'émotion saisie (ligne rouge qui
  distingue Kær des apps grand public type How We Feel).

## 5. Taxonomie proposée (v2)

> 8 familles : les 6 de Willcox + 2 ajouts cliniques documentés (Dégoût, Honte et
> culpabilité). Nuances **qualitatives et distinctes** (jamais des paliers d'intensité).
> Chaque nuance a 2 mots précis (niveau 3). Le mode ado réutilise les mêmes mots
> (registre géré dans les consignes, § 8).

**Principe directeur (la correction clé) :** l'arbre encode le **QUOI** (qualité de
l'émotion), le curseur encode le **COMBIEN** (intensité). Exemple : « panique » n'est
pas un mot de l'arbre. C'est « Effroi » ou « Anxiété » saisi à une intensité de 9 ou 10
sur le curseur. Les deux axes ne se mélangent jamais.

### 5.1 JOIE (`joy`) — jaune

| Nuance (N2) | EN | Mots précis (N3) |
|---|---|---|
| Plaisir | pleasure | réjoui, ravi |
| Enthousiasme | excited | enjoué, stimulé |
| Amour | love | affectueux, attaché |
| Émerveillement | wonder | ébloui, inspiré |
| Gratitude | grateful | reconnaissant, touché |

### 5.2 TRISTESSE (`sadness`) — bleu

| Nuance (N2) | EN | Mots précis (N3) |
|---|---|---|
| Abattement | despondent | découragé, accablé |
| Solitude | lonely | seul, isolé |
| Chagrin | hurt | peiné, blessé |
| Vide | empty | éteint, vidé |
| Nostalgie | wistful | mélancolique, plein de regrets |

### 5.3 COLÈRE (`anger`) — rouge

| Nuance (N2) | EN | Mots précis (N3) |
|---|---|---|
| Irritation | irritated | agacé, contrarié |
| Frustration | frustrated | empêché, déçu |
| Hostilité | hostile | rancunier, amer |
| Indignation | indignant | révolté, outré |
| Susceptibilité | slighted | vexé, froissé |

### 5.4 PEUR (`fear`) — violet

> Nuances **qualitatives**, pas un escalier d'intensité (correction du défaut v1).

| Nuance (N2) | EN | Mots précis (N3) | Distinction |
|---|---|---|---|
| Anxiété | anxious | inquiet, tendu | orientée vers l'avenir, diffuse |
| Insécurité | insecure | vulnérable, fragile | vulnérabilité de soi |
| Effroi | scared | effrayé, alarmé | menace aiguë, présente |
| Méfiance | wary | méfiant, sur mes gardes | menace venant d'autrui |
| Impuissance | powerless | démuni, paralysé | submersion, incapacité d'agir |

### 5.5 DÉGOÛT (`disgust`) — vert olive *(famille à confirmer)*

| Nuance (N2) | EN | Mots précis (N3) | Distinction |
|---|---|---|---|
| Répulsion | repelled | écœuré, révulsé | dégoût viscéral, physique |
| Mépris | contempt | dédaigneux, méprisant | dégoût moral, envers autrui |
| Désapprobation | disapproving | réprobateur, choqué | rejet d'un acte, d'une idée |

### 5.6 HONTE ET CULPABILITÉ (`self_conscious`) — gris-rose *(ajout clinique)*

> Émotions auto-conscientes (Tangney). Honte = jugement négatif **du soi**, pousse au
> retrait. Culpabilité = jugement négatif d'**un acte**, pousse à réparer. Distinction
> centrale en TCC, absente de la v1.

| Nuance (N2) | EN | Mots précis (N3) |
|---|---|---|
| Honte | shame | honteux, humilié |
| Culpabilité | guilt | coupable, plein de remords |
| Gêne | embarrassment | gêné, mal à l'aise |
| Dévalorisation | inadequate | incapable, insuffisant |

### 5.7 FORCE (`powerful`) — orange

> Famille de l'**agentivité active** (capacité d'agir, se sentir capable). À distinguer
> d'Apaisement (sécurité au repos), voir § 7. Clé de nœud technique conservée
> (`powerful`) ; seul le libellé affiché change.

| Nuance (N2) | EN | Mots précis (N3) |
|---|---|---|
| Confiance en soi | confident | assuré, sûr de moi |
| Fierté | proud | fier, accompli |
| Courage | determined | déterminé, audacieux |
| Espoir | hopeful | optimiste, confiant en l'avenir |
| Valorisation | valued | respecté, reconnu |

### 5.8 APAISEMENT (`peaceful`) — turquoise

> Famille de la **sécurité au repos** (absence de menace, lien apaisé). À distinguer de
> Force (agentivité active), voir § 7. Clé de nœud technique conservée (`peaceful`) ;
> seul le libellé affiché change.

| Nuance (N2) | EN | Mots précis (N3) |
|---|---|---|
| Calme | calm | détendu, posé |
| Sérénité | serene | serein, en paix |
| Sécurité | secure | rassuré, en confiance |
| Compréhension | understood | compris, écouté |
| Acceptation | accepting | réconcilié, libéré |

**Volumétrie** : 8 familles, 37 nuances, 74 mots précis. Profondeur libre : validation
possible à n'importe quel niveau.

**Équilibre confortable / inconfortable** : 3 familles confortables (Joie, Force,
Apaisement) contre 5 inconfortables (Tristesse, Colère, Peur, Dégoût, Honte et culpabilité).
Willcox tenait à un équilibre 3/3. Ici le déséquilibre est assumé : il reflète la
réalité clinique d'une population en soin. Retirer Dégoût ramènerait à 3/4, plus proche
de Willcox. Décision du clinicien.

## 6. Écarts documentés par rapport au canon

| Écart | Canon (Willcox/Roberts) | Choix v2 | Justification |
|---|---|---|---|
| Honte et culpabilité | classées sous Sad / Bad | famille propre | Émotions auto-conscientes distinctes (Tangney), centrales en TCC. |
| Peur | mêle intensités | nuances qualitatives + intensité au curseur | Sépare QUOI et COMBIEN ; évite l'escalier d'intensité. |
| Dégoût | mêle physique / moral / soi | physique + moral seulement (le « soi » va en Honte) | Famille conceptuellement propre. |
| Surprise | présente chez Roberts | écartée | Valence neutre, transitoire, peu centrale en clinique. |
| Mots | anglais | curation fr/en clinique | Adaptation linguistique et clinique assumée, pas une traduction littérale. |

## 7. Champs additionnels d'une saisie

| Champ | Type | Obligatoire | Note |
|---|---|---|---|
| Émotion (famille / nuance / mot) | sélection arbre | famille oui, reste optionnel | Le QUOI. |
| Intensité | curseur 1 à 10 brut | non | Le COMBIEN. Sans label. |
| Contexte | chips multi-choix neutres | non | Ex. travail, famille, relation, santé, argent, soi, autre. |
| Note | texte libre | non | Restituée brute. |

**Distinction Force / Apaisement** (frontière floue corrigée) : Force = je me sens
**capable d'agir** (confiance, fierté, courage) ; Apaisement = je me sens **en sécurité
au repos** (calme, lien apaisé, rien à affronter). Cette définition sera reflétée dans
les consignes des deux familles pour guider le choix du patient.

## 8. Mode ado (teen)

- Les **mots d'émotion sont identiques** (un ado dit « anxieux », « honteux »).
- Le mode teen change le **registre des consignes** (tutoiement) et le **ton**.
- Chaque clé `modules.emotion_wheel.*` aura sa variante `teen.json` (fr + en).

## 9. Étapes suivantes (après validation)

1. Valider la taxonomie ; trancher Dégoût et Surprise.
2. Réécrire le seed `module_content_fields` : remplacer les nœuds Plutchik (`ew.*`) par
   les nœuds v2 (config-first, zéro texte en dur).
3. Clés i18n fr/en common + fr/en teen.
4. Champs intensité + contexte ajoutés au layout `tree_selector` sans casser sa
   généricité.
5. Tests + mise à jour `docs/modules/emotion_wheel.md`.
6. Parité web praticien (preview) avant mobile.

## 10. Sources

**Mécanisme (étayé)**
- Lieberman et al., *Putting feelings into words* : https://pubmed.ncbi.nlm.nih.gov/17576282/
- Bases neurales affect labeling vs réévaluation : https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3970015/
- Granularité, scoping review 2025 : https://www.sciencedirect.com/science/article/abs/pii/S0022395625004881
- Granularité et auto-évaluation répétée : https://pmc.ncbi.nlm.nih.gov/articles/PMC8355493/
- RCT app reconnaissance émotionnelle (alexithymie) : https://pubmed.ncbi.nlm.nih.gov/31110950/
- Revue systématique traitements alexithymie : https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11673933/

**Instrument (outil clinique, non validé psychométriquement)**
- Willcox, *The Feeling Wheel* (Transactional Analysis Journal, 1982) : https://journals.sagepub.com/doi/10.1177/036215378201200411
- Notice structure/finalité : https://www.semanticscholar.org/paper/The-Feeling-Wheel-A-Tool-for-Expanding-Awareness-of-Willcox/499a32b0753128e0fcdb09e95e9789c5c6262a19
- Feeling Wheel en TCC/DBT/ACT : https://www.risewellpsychology.com/feelings-wheel
- Plutchik = intensité, pas granularité : https://www.6seconds.org/2025/02/06/plutchik-wheel-emotions/

**Roue validée (alternative documentée)**
- Geneva Emotion Wheel, Swiss Center for Affective Sciences : https://www.unige.ch/cisa/gew
- Scherer et al., *The GRID meets the wheel* (2013), propriétés psychométriques GERT-S : https://link.springer.com/article/10.3758/s13428-015-0646-4

**Émotions auto-conscientes (honte / culpabilité)**
- Revue systématique honte, culpabilité, gêne, fierté (2025) : https://pmc.ncbi.nlm.nih.gov/articles/PMC12647085/
- Honte et culpabilité dans l'anxiété sociale, effets de la TCC (PLOS One) : https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0061713

**Modèle dimensionnel / concurrence**
- How We Feel / Mood Meter (Yale, Brackett) : https://medicine.yale.edu/news-article/the-how-we-feel-app-helping-emotions-work-for-us-not-against-us/
- Modèle circumplex (Russell) : https://www.manifested.me/blog/russells-circumplex-model-explained
- Comparatif apps 2026 (LifeStance) : https://lifestance.com/blog/best-mood-tracking-apps-therapists-top-choices-2026/
