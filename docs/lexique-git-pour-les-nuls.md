# 🧰 Le lexique Git/GitHub pour les nuls — spécial PsyTool

> Fiche pensée pour un usage non-développeur : comprendre ce que font le dev et Claude,
> et savoir **quand c'est à toi de jouer**.

## 🎬 La grande image (l'analogie qui débloque tout)

Ton projet PsyTool est **un énorme classeur de recettes** sur lequel plusieurs personnes
travaillent.

- Le problème : si tout le monde gribouille sur le **même** classeur en même temps → chaos.
- La solution : un système qui garde **l'historique de chaque modification**, permet de
  **travailler sur une copie sans casser l'original**, et de **fusionner proprement** le
  travail de chacun.

Ce système, c'est **Git**. **GitHub**, c'est le site où le classeur est rangé en sécurité
et partagé entre toi, ton dev et Claude.

> 🧠 **Retiens** : Git = le système de sauvegarde intelligent. GitHub = le coffre-fort en ligne.

---

## 📖 Les mots de base, du plus simple au plus subtil

### 🗂️ Repository (« repo »)
**= Le classeur entier.** Tout le projet PsyTool (web, mobile, base de données) + son
historique complet.

### 📸 Commit
**= Une photo / un point de sauvegarde à un instant T.** Comme une sauvegarde de jeu vidéo.
Chaque commit a une petite phrase qui explique le changement. On peut **toujours revenir
en arrière** à n'importe quelle photo.
Exemple : `feat(side_effects): date modifiable à la saisie`.

### 🌿 Branch (branche)
**= Un brouillon parallèle, une copie de travail isolée.**
- **`main`** = la branche **officielle**, la version propre de référence.
- **Les autres branches** = des chantiers en cours, séparés de `main`.

> 🧠 `main` = le plat servi au restaurant. Une branche = ta cuisine d'essai.

### ⬇️ Fetch
**= « Va voir s'il y a du nouveau » (sans rien toucher chez moi).** Télécharge les infos
mais ne modifie pas ton travail. Inoffensif.

### ⬇️✅ Pull (tirer)
**= Fetch + appliquer.** Récupère les nouveautés **et** les intègre à ta copie. À faire
pour être **à jour** avant de se remettre au travail.

### ⬆️ Push (pousser)
**= « Envoie mon travail sur le coffre-fort en ligne. »** Tant que tu n'as pas poussé, tes
commits restent **uniquement sur ton ordinateur**.

### 🔀 Merge (fusionner)
**= Mélanger deux branches en une.** Quand un chantier est validé, on le fusionne dans
`main` → la fonctionnalité devient officielle.

### ⚠️ Conflict (conflit)
**= Deux personnes ont modifié la même ligne, Git ne sait pas qui a raison.** Un humain
doit trancher. 👉 **Job du dev/Claude, jamais le tien.**

### 📬 Pull Request (PR) — *le mot le plus important pour toi*
**= « J'ai fini mon chantier, est-ce qu'on peut le valider et l'intégrer ? »** C'est une
**demande de validation** sur GitHub. L'endroit où on relit le travail avant de le rendre
officiel. **Ta fenêtre pour voir, comprendre et donner ton feu vert.**

> 🧠 Tu rends ton mémoire → le directeur relit, annote, valide. La PR = ce moment.

### 👀 Review (revue de code)
**= La relecture critique de la PR** : propre ? sûr ? sans bug ? conforme aux règles ?
(Claude le fait via le skill `pr-review`.)

---

## 🧩 Mots bonus

| Mot | Traduction express |
|---|---|
| **Clone** | Télécharger une **copie complète** du projet sur une nouvelle machine (la 1ʳᵉ fois). |
| **Origin** | Le surnom du coffre-fort en ligne (GitHub). |
| **Checkout / Switch** | **Changer de branche** = passer d'un chantier à un autre. |
| **Staging / `add`** | Choisir **quelles modifications** entrent dans la prochaine photo (commit). |
| **Diff** | La liste **« avant / après »**. Rouge = supprimé, vert = ajouté. |
| **Revert / Reset** | **Revenir en arrière**, annuler des changements. |
| **`.gitignore`** | Liste des fichiers qu'on **ne sauvegarde pas** (mots de passe, fichiers temporaires). |

---

## 🎯 QUAND est-ce à TOI de jouer ?

Dans 95% des cas, **tu n'as rien à taper**. Le dev et Claude gèrent toute la plomberie.
Ton rôle :

| Moment | Ce que tu fais | Pourquoi |
|---|---|---|
| **Début d'une feature** | Tu **décris le besoin** (métier, clinique). | Toi seul connais le terrain. |
| **Quand une PR est ouverte** | Tu **regardes la PR**, lis le résumé, poses des questions. | Ton point de contrôle. |
| **Pour tester** | Tu **lances l'app** (`npm run web` / `npm run mobile`) et tu cliques. | Ton œil clinique attrape ce que le code ne voit pas. |
| **Pour valider** | Tu dis **« c'est bon, on fusionne »** ou **« il manque X »**. | Le feu vert final t'appartient. |

**PAS ton job** : résoudre les conflits, choisir quand pousser/fusionner techniquement,
taper des commandes Git (possible mais jamais obligatoire).

---

## 🔄 Le cycle de vie complet, en une histoire

```
1. 🌿 On crée une BRANCHE        → un chantier isolé, main reste intact
2. 📸 On fait des COMMITS         → photos régulières du travail qui avance
3. ⬆️ On PUSH                     → le travail part sur GitHub (sauvegardé)
4. 📬 On ouvre une PULL REQUEST   → "regardez, est-ce bon ?"  ← TON MOMENT
5. 👀 REVIEW + tests              → relecture, corrections, tu testes l'app
6. 🔀 On MERGE dans main          → la fonctionnalité devient officielle  ← TON FEU VERT
7. ⬇️ Tout le monde PULL          → chacun récupère la version à jour
```

Et ça recommence pour la fonctionnalité suivante. 🔁

---

## 💡 La phrase à garder en tête

> **Git protège ton projet contre les bêtises. Une branche est un brouillon sûr, une Pull
> Request est une demande de validation, et un merge rend le travail officiel.
> Ton rôle : décrire le besoin, regarder la PR, tester, valider.**
