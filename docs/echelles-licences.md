# Échelles cliniques : statut juridique et couverture cible

> **Statut du document : base de travail, à reprendre avant commercialisation.**
> La partie « échelles » de Kær a été livrée rapidement (périmètre bêta) sans arbitrage
> juridique complet. Ce document consigne l'analyse échelle par échelle des droits
> d'auteur, tranche ce qu'on garde ou retire, et liste les échelles réellement libres
> pour compléter la couverture. Il sert de point de départ à la refonte de cette partie.
>
> Analyse consolidée le 2026-07-25. Les statuts valent pour les **versions originales** :
> il faudra vérifier que la **traduction française** intégrée est bien la version
> officielle libre (voir § Points de vigilance).

---

## 1. Verdict sur les échelles actuellement intégrées

Échelles présentes dans l'app à ce jour : `phq9`, `gad7`, `bsl23`, `rcads`, `snap_iv`,
`asrs6`, `asrs18`, `epds`, `nsi`.

| Échelle | Verdict | Détail juridique |
|---|---|---|
| **PHQ-9** | Garder | Libérée par Pfizer : reproduction, traduction, diffusion sans permission, usage commercial inclus. Aucune démarche. |
| **GAD-7** | Garder | Même régime que le PHQ-9. Aucune démarche. |
| **ASRS v1.1 (6 et 18 items)** | Garder | Bonne surprise. Licence officielle NYU/Harvard : « freely available for clinical and non-clinical use, including commercial use », versions électroniques explicitement autorisées. **Deux conditions strictes** : attribution obligatoire (citation NYU/Harvard visible dans l'app) et **aucune modification du texte des items**. |
| **EPDS** | Exclure (demander) | Mauvaise surprise. Copyright Royal College of Psychiatrists (Cox 1987). La photocopie individuelle est tolérée, mais toute rediffusion « online or by any other medium » exige une permission écrite. Le RCPsych a déjà **refusé** l'intégration de l'EPDS dans l'app CamCOPS. Autorisation incertaine, mais un process de demande existe. |
| **SNAP-IV** | Exclure (demander) | Copyright J.M. Swanson. Remplaçant libre quasi équivalent disponible : **Vanderbilt (NICHQ)**, voir § 2. |
| **RCADS-25** | Exclure (demander) | Site officiel UCLA explicite : « Commercial distribution of the RCADS instruments [...] in any form or medium is prohibited » ; intégration électronique = permission écrite requise. Process formel via UCLA (Chorpita & Spence). Remplaçants libres : **PHQ-A** (dépression ado) + **SCARED** (anxiété enfant). |
| **BSL-23** | Suspendre (vérifier) | Aucun régime de licence publié nulle part. Diffusée gratuitement pour clinique/recherche par l'équipe Bohus (ZI Mannheim), mais rien n'autorise explicitement l'intégration commerciale. Un mail à Bohus/ZI Mannheim s'impose. Chances plutôt bonnes vu leur culture de diffusion gratuite. |
| **NSI** | Exclure | Double problème. Échelle très récente (Geoffroy et al., 2024, Journal of Sleep Research / Wiley) : ne passe pas le critère « connue et communément utilisée ». Droits auteurs/Wiley non clarifiés (CC BY-NC : usage commercial exclu). L'auteur étant français (GHU Paris), une demande directe serait facile plus tard si besoin. |

**Bilan : on garde 4 échelles sur 9** (PHQ-9, GAD-7, ASRS×2), **on en retire 5**
(EPDS, SNAP-IV, RCADS, NSI, et BSL-23 en attente de vérification).

---

## 2. Échelles réellement libres pour compléter la couverture

Toutes connues, validées, communément utilisées, utilisables **dès maintenant** dans
une app commerciale (sauf mention d'une démarche gratuite à effectuer).

### Adulte

| Échelle | Domaine | Statut |
|---|---|---|
| PHQ-9 / GAD-7 | Dépression / Anxiété | Déjà intégrées |
| PHQ-15 | Symptômes somatiques | Libre. Même famille Pfizer, même liberté totale |
| ASRS v1.1 | TDAH adulte | Déjà intégrée (attribution + pas de modification) |
| PCL-5 | Stress post-traumatique | **Domaine public** (National Center for PTSD, gouvernement US). Aucune permission. Référence mondiale du PTSD |
| AUDIT / AUDIT-C | Alcool | Libre (OMS), reproduction autorisée. Standard mondial |
| WHO-5 | Bien-être | Libre, sans permission |
| HAM-D 17 | Dépression (hétéro) | Domaine public (version originale 1960 uniquement) |
| ASRM (Altman) | Manie (auto) | Domaine public. Complète le PHQ-9 pour le versant bipolaire |
| C-SSRS | Risque suicidaire | Gratuite y compris pour produits commerciaux via le Columbia Lighthouse Project, **mais demande gratuite à soumettre** et cadre à respecter. Forte valeur ajoutée pour un public de psychiatres |

### Enfant / adolescent

| Échelle | Domaine | Statut |
|---|---|---|
| Vanderbilt (NICHQ) | TDAH enfant, parent + enseignant | Libre (NICHQ/AAP), reproduction autorisée. **Remplaçant naturel de la SNAP-IV** : mêmes critères DSM + TOD, même logique parent/enseignant |
| PHQ-A | Dépression ado (11-17) | Libre (famille PHQ). Remplace le versant dépression du RCADS |
| SCARED | Anxiété enfant (parent + enfant) | Gratuite et très utilisée (Birmaher, Univ. Pittsburgh). Un mail de confirmation pour l'usage commercial est prudent. Remplace le versant anxiété du RCADS |

---

## 3. Pièges connus (à ne pas réintégrer par erreur)

- **SDQ** : l'échelle enfant la plus connue, mais **payante dès le numérique**
  (youthinmind facture l'usage en ligne).
- **Sommeil** : ISI, PSQI et Epworth sont **tous les trois sous licence commerciale**
  (Mapi / universités). Pour le sommeil, la meilleure carte reste l'**agenda du sommeil
  maison** déjà présent : technique libre, et cliniquement plus riche pour le suivi
  qu'un score.
- **TOC** : Y-BOCS au statut ambigu.
- **Autisme** : M-CHAT-R exige une licence pour l'usage électronique.
- **Borderline** : dépend du sort du BSL-23 (à vérifier auprès de Bohus).

---

## 4. Couverture obtenue avec la liste 100 % sécurisée

Domaines couverts sans risque juridique :

- Dépression : PHQ-9, PHQ-A, HAM-D
- Anxiété : GAD-7, SCARED
- Bipolarité : ASRM
- PTSD : PCL-5
- Risque suicidaire : C-SSRS (après demande gratuite)
- Addictions : AUDIT
- Somatisation : PHQ-15
- Bien-être : WHO-5
- TDAH adulte : ASRS ; enfant : Vanderbilt

**Seuls trous sans option libre incontestée** : TOC (Y-BOCS ambigu), autisme
(M-CHAT-R sous licence électronique), borderline (si le BSL-23 ne répond pas). Ce sont
ces trois-là, plus l'EPDS, qui valent la peine d'écrire aux auteurs.

---

## 5. Prochaines démarches

Emails de demande d'autorisation à rédiger (ordre de priorité) :

1. **C-SSRS -> Columbia (Lighthouse Project)** : simple formalité gratuite, débloque une
   échelle à forte valeur. À faire en premier.
2. **BSL-23 -> Bohus / ZI Mannheim** : chances plutôt bonnes, débloque le versant
   borderline déjà intégré.
3. **EPDS -> Royal College of Psychiatrists** : autorisation incertaine (refus connu
   sur CamCOPS), mais process existant.
4. **RCADS -> UCLA (Chorpita & Spence)** : jouable via le process formel ; sinon,
   remplacer par PHQ-A + SCARED.

Langue : anglais pour Harvard/UCLA/Columbia/Mannheim/RCPsych, français pour Geoffroy
(NSI, si on y revient).

Alternative pragmatique sans aucune démarche : **remplacer** EPDS, SNAP-IV, RCADS, NSI
par leurs équivalents libres (respectivement : pas d'équivalent direct périnatal libre
identifié pour l'EPDS -> demande RCPsych ; Vanderbilt ; PHQ-A + SCARED ; agenda du
sommeil maison).

---

## 6. Points de vigilance

- **Traduction française** : tous ces statuts valent pour les versions originales
  (anglaises). Vérifier que la version FR intégrée est bien la **traduction officielle
  libre**. Pour les PHQ/GAD, les versions FR validées sont téléchargeables gratuitement
  sur le site officiel des PHQ Screeners.
- **Fidélité aux items** : ne jamais reformuler les items, consignes ou options d'une
  échelle validée (règle métier Kær, voir `feedback_scale_fidelity`). L'ASRS l'impose
  aussi contractuellement (« no modification »).
- **Attribution** : l'ASRS exige la citation NYU/Harvard **visible dans l'app** ;
  vérifier qu'elle y figure.
- **Toute nouvelle échelle** ajoutée à l'app reçoit une ligne dans ce document, avec
  son statut juridique tranché **avant** l'intégration.

---

## Sources

- ASRS v1.1 : NYU Technology Licensing (usage commercial libre, attribution requise)
- EPDS : CamCOPS (copyright RCPsych, permission écrite requise, intégration refusée)
- RCADS : page permissions officielle UCLA (distribution commerciale interdite)
- BSL-23 : NovoPsych (Bohus et al. 2009, pas de licence publiée)
- NSI : Geoffroy et al. 2024, Journal of Sleep Research (Wiley), CC BY-NC
- Vanderbilt : téléchargement libre NICHQ
- C-SSRS : Columbia Psychiatry (Lighthouse Project)
- AUDIT : OMS
- PCL-5 : National Center for PTSD (domaine public)
