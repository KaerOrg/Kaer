# 📝 Les commandes du quotidien pour les nuls — spécial PsyTool

> Fiche pensée pour un usage non-développeur : savoir **quelle commande taper**, **où**,
> **quand**, et **quoi faire si ça plante**.

## 🖥️ D'abord : c'est quoi « taper une commande » ?

Une commande, c'est une **phrase qu'on écrit à l'ordinateur** pour lui demander une action,
dans une fenêtre noire/bleue appelée **terminal** (ou « console »).

Dans VS Code (l'éditeur que tu utilises), le terminal s'ouvre en bas de l'écran :
**menu `Terminal` → `Nouveau terminal`** (ou raccourci `Ctrl` + `ù`).

> 🧠 **Règle d'or** : tu te places toujours **à la racine du projet** (le dossier `PsyTool`)
> avant de taper. Le terminal de VS Code y est déjà par défaut. ✅

---

## 🚀 Les 2 commandes que tu utiliseras le plus

### `npm run web`
**= Lance l'interface praticien (le tableau de bord web).**

Tu tapes ça quand tu veux **voir et tester l'app du praticien** dans ton navigateur.
Après quelques secondes, une adresse apparaît (du genre `http://localhost:5173`).
Tu cliques dessus (ou tu la colles dans Chrome) → l'app s'ouvre.

> 🧠 « localhost », c'est **ton propre ordinateur**. L'app tourne chez toi, en privé,
> personne d'autre ne la voit. C'est ton labo de test.

### `npm run mobile`
**= Lance l'app patient (mobile, via Expo).**

Tu tapes ça pour **tester l'app du patient**. Un QR code et un menu apparaissent.
Pour la voir sur ton téléphone : installe l'appli **Expo Go**, puis scanne le QR code.

---

## ⏯️ Comment ça marche, concrètement

1. Tu tapes la commande, tu fais `Entrée`.
2. Le terminal **réfléchit** quelques secondes (texte qui défile = normal, pas de panique).
3. Quand c'est prêt, il **reste allumé** : l'app tourne **tant que le terminal tourne**.
4. Pour **arrêter** l'app : clique dans le terminal et fais `Ctrl` + `C`.

> 🧠 Tant que l'app tourne, le terminal est « occupé » : tu ne peux pas y taper autre chose.
> Si tu as besoin d'une 2ᵉ commande en parallèle, **ouvre un 2ᵉ terminal**
> (l'icône `+` en haut à droite du panneau Terminal).

---

## 🧩 Autres commandes utiles (plus rares)

| Commande | Ce qu'elle fait | Quand l'utiliser |
|---|---|---|
| `npm install` | Télécharge/met à jour les « briques » dont le projet a besoin. | Après avoir récupéré du nouveau code (`pull`), ou si l'app refuse de démarrer. |
| `git status` | Montre **où tu en es** : sur quelle branche, ce qui a changé. | Pour te repérer, à tout moment. Inoffensif. |
| `git pull` | Récupère la dernière version du projet depuis GitHub. | Avant de te remettre au travail, pour être à jour. |

> 🧠 `git status` est ta **boussole** : tu peux la taper autant que tu veux, elle ne change
> jamais rien. Elle te dit juste « voilà où tu es ».

---

## 🆘 Si ça plante — le mode d'emploi anti-panique

Le terminal affiche du **texte rouge** ou « error » ? Pas de stress. Voici l'ordre à suivre :

1. **Ne ferme rien, ne supprime rien.** Une erreur n'a rien cassé de définitif.
2. **Essaie la combine magique n°1** : arrête (`Ctrl` + `C`), puis tape `npm install`,
   puis relance ta commande. Ça résout une grande partie des soucis.
3. **Si ça persiste** : **copie tout le texte rouge** et colle-le à Claude (moi) en disant
   « ça plante, voilà l'erreur ». Je traduis et je te dis quoi faire.

> 🧠 Une erreur dans le terminal = juste l'ordi qui dit « je n'ai pas compris » ou « il me
> manque un truc ». Ce n'est **jamais** une catastrophe irréversible.

---

## 💡 La phrase à garder en tête

> **`npm run web` pour tester l'app praticien, `npm run mobile` pour l'app patient.
> `Ctrl + C` pour arrêter. En cas d'erreur : `npm install` + relancer, et si ça résiste,
> copier le texte rouge à Claude.**
