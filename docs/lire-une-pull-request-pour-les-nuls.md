# 🔍 Lire une Pull Request sur GitHub, étape par étape — pour les nuls

> Fiche pensée pour un usage non-développeur : savoir **où cliquer**, **comment lire les
> changements**, et **comment donner ton feu vert** (ou demander une correction).

## 🎯 Rappel express : une PR, c'est quoi déjà ?

Une **Pull Request (PR)** = une **demande de validation**. Quelqu'un (le dev ou Claude) a
fini un chantier sur une branche et dit : « voici tout ce que j'ai changé, regarde et
dis-moi si c'est bon avant qu'on l'intègre à la version officielle (`main`) ».

C'est **ton point de contrôle**. Tu n'as pas besoin de comprendre chaque ligne de code —
tu dois comprendre **ce que ça fait** et **si ça répond au besoin**.

---

## 🧭 Étape 1 — Trouver la PR

1. Va sur le projet dans ton navigateur : `github.com/<ton-compte>/PsyTool`.
2. Clique sur l'onglet **« Pull requests »** (en haut, à côté de « Code »).
3. Tu vois la liste des demandes en cours. Clique sur celle qui t'intéresse (son titre).

> 🧠 Un **chiffre** à côté de « Pull requests » = le nombre de demandes en attente.

---

## 📄 Étape 2 — Lire le résumé (l'onglet « Conversation »)

C'est la première chose qui s'affiche. C'est **le plus important pour toi**.

- **Le titre** : la phrase qui résume le chantier.
- **La description** : ce qui a été fait, en français, et pourquoi.
- **Les commentaires** : la discussion entre les participants.

> 🧠 Si la description est claire et correspond à ce que tu voulais, tu as déjà 80% de
> l'info. Lis ça **en premier**, tranquillement.

---

## 🟥🟩 Étape 3 — Voir les changements (l'onglet « Files changed »)

Clique sur **« Files changed »** (en haut de la PR). Tu vois le fameux **« avant / après »** :

- **Lignes vertes avec `+`** = ce qui a été **ajouté**.
- **Lignes rouges avec `-`** = ce qui a été **supprimé**.
- Le reste (gris/blanc) = inchangé, juste là pour le contexte.

> 🧠 Tu n'es **pas obligé** de comprendre le code. Survole, repère les fichiers qui parlent
> de ce qui t'intéresse (ex. un fichier avec `side_effects` dans le nom = les effets
> indésirables). Le but : avoir une idée générale, pas tout déchiffrer.

---

## 🧪 Étape 4 — Tester pour de vrai (le vrai pouvoir du clinicien)

Le code peut être « techniquement correct » mais mal se comporter à l'usage. **C'est là que
ton œil est irremplaçable.**

1. Récupère la branche de la PR (demande au dev/à Claude la commande exacte, c'est en 1 ligne).
2. Lance l'app (`npm run web` ou `npm run mobile` — voir la fiche commandes).
3. Clique, saisis, navigue **comme un vrai praticien ou patient**.
4. Vérifie : est-ce que ça fait **ce qui était demandé** ? Est-ce clair ? Conforme MDR ?

---

## ✍️ Étape 5 — Donner ton avis

Toujours dans la PR, tu peux écrire en bas de l'onglet « Conversation » :

- **C'est bon** → un commentaire du genre « Testé, ça répond au besoin, on peut fusionner ».
- **Il manque quelque chose** → décris précisément : « Quand je fais X, il se passe Y, or
  j'attendais Z ». Plus c'est concret, plus c'est facile à corriger.

Tu peux aussi commenter **une ligne précise** : dans « Files changed », survole une ligne,
clique sur le petit **`+` bleu** qui apparaît à gauche, écris ton commentaire.

> 🧠 Tu n'as **pas** à cliquer sur le bouton vert « Merge » toi-même. Donne ton feu vert
> par écrit, le dev/Claude s'occupe de la fusion technique.

---

## ✅ Ta checklist quand une PR t'est soumise

- [ ] J'ai lu le **titre** et la **description** (onglet Conversation).
- [ ] J'ai survolé les **changements** (Files changed) pour situer ce qui bouge.
- [ ] J'ai **testé l'app** sur le besoin concerné.
- [ ] Ça répond au besoin **et** c'est conforme MDR (rien qui interprète/conclut à ma place).
- [ ] J'ai écrit mon **feu vert** ou ma **demande de correction**.

---

## 💡 La phrase à garder en tête

> **Une PR, c'est ta relecture avant que le travail devienne officiel. Lis le résumé,
> survole les changements, teste l'app, puis donne ton feu vert par écrit. Comprendre
> chaque ligne de code n'est pas ton job — vérifier que ça répond au besoin, si.**
