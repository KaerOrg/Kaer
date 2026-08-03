# Règle — Synchronisation Notion (board d'équipe partagé)

> **Déclencheur : au fil du travail, dès qu'un jalon est atteint (voir liste ci-dessous).**

Le projet est piloté sur un espace Notion **partagé Olivier + Guillaume**. Le board
doit refléter les jalons au fil de l'avancement, **des deux côtés** : chacun fait
avancer des choses de son côté, le Notion est la vue commune à jour.

**Prérequis :** chaque personne doit avoir autorisé le connecteur Notion dans son
Claude (réglages des connecteurs claude.ai). Sans connecteur, cette règle est
simplement **inerte** (aucune erreur, aucune action Notion possible).

**Validation :** la validation d'un seul des deux suffit. Pas besoin de l'accord des
deux pour une mise à jour.

## Synchroniser SI (un de ces cas, jamais les étapes intermédiaires)

- une **décision est actée** (un choix ferme une alternative, ex. HAM-D retenu, MADRS écartée)
- une **tâche / un chantier change de statut** (À faire -> En cours -> Terminé)
- un **livrable est bouclé et validé** (module, feature, doc terminés)
- un **nouveau chantier / risque** apparaît et mérite une entrée au board
- le **périmètre ou le plan change**

## Ne JAMAIS synchroniser (bruit + tokens pour rien)

- étapes intermédiaires, essais, exploration, tests qui passent, petits commits,
  refactors mineurs, travail en cours non tranché

## Comment

- **Grouper** : réunir les jalons et faire **une seule passe** en fin d'échange
  (une écriture par page touchée), jamais une synchro par micro-décision.
- **Board partagé, ne pas écraser l'autre** : **relire la page avant d'écrire**, et
  faire des modifs **ciblées** (`update_content` en recherche/remplacement), **jamais**
  un remplacement global du contenu, pour ne pas effacer ce que l'autre a avancé
  entre-temps.
- **Cibler une page existante** ; ne **jamais créer** de page sans demander.
- **Notion = résumé décisionnel** : décision + statut + lien vers la doc du repo, pas
  de pavé dupliqué. La source de vérité reste `docs/…`.
- **Agir directement** pour les updates légères et sûres (statut, case à cocher, une
  ligne de décision). **Demander avant** d'écrire une section entière ou de créer une page.
- **Sessions interactives uniquement** : ne pas synchroniser depuis un sous-agent (une
  review de code, par exemple, ne touche pas au Notion).

## Pages de référence (cibler sans chercher à l'aveugle)

| Repère | ID |
|---|---|
| Espace Notion (Guillaume Zarb's Space) | `332cc560-e75c-8188-8ea4-0003d10d0622` |
| Page « Kær — QG du projet » | `3a6cc560-e75c-8135-be68-e0a487f324af` |
| Base « ✅ Tâches » | `79bf7123-b76e-4c94-a004-d3d2447d2d75` |
