# Règle — Procédure de merge

> **Déclencheur : toute demande de l'utilisateur du type « fais un merge », « merge »,
> « resynchronise », « mets à jour la branche depuis main ».**

Quand l'utilisateur demande un merge, exécuter **toujours** ces étapes **dans cet ordre**,
sans en sauter aucune :

## 1. Resynchroniser `main` distant

```bash
git fetch origin
```

Toujours partir de l'état distant à jour (`origin/main`), jamais d'un `main` local
potentiellement en retard. Vérifier l'écart avec `git status` / `git log --oneline`.

## 2. Merger

```bash
git merge origin/main
```

Merger `origin/main` (la cible fraîchement resynchronisée) dans la branche courante.

## 3. Résoudre les conflits

- Lire **chaque** fichier en conflit en entier avant de trancher.
- Conflits additifs (les deux côtés ajoutent du contenu distinct) → **garder les deux**.
- Vérifier qu'il ne reste **aucun** marqueur :
  ```bash
  grep -rn "^<<<<<<<\|^=======\|^>>>>>>>" <fichiers en conflit>
  ```
- Inspecter aussi les fichiers **auto-mergés sensibles** (`database.types.ts`,
  `schema.sql`, `seed.sql`) : un auto-merge « réussi » peut produire du code incohérent.

## 4. Tests unitaires — web ET mobile

```bash
cd apps/web    && npx vitest run
cd apps/mobile && npx jest
```

Les deux suites doivent passer. Aucune n'est optionnelle.

## 5. Compilation TypeScript — web ET mobile

```bash
cd apps/web    && npx tsc -b --noEmit
cd apps/mobile && npx tsc --noEmit
```

Les deux compilations doivent passer **sans erreur** et **sans suppression**
(`@ts-ignore`, `as any`, `as unknown as X` interdits — cf.
[`coding-standards.md`](coding-standards.md)). Si une erreur de type apparaît à cause
d'un fichier de types périmé (ex. `database.types.ts` désynchronisé de `schema.sql`),
**corriger le type à la source**, jamais caster.

## Règles transverses

- **Ne jamais conclure le merge** (`git commit`) tant que les étapes 4 et 5 ne sont pas
  toutes vertes. Un merge qui casse les tests ou la compilation n'est pas terminé.
- **Ne pas pousser** (`git push`) sans validation explicite de l'utilisateur.
- Rapporter fidèlement : si une suite échoue, le dire avec la sortie — ne pas masquer.
- L'ordre est strict : resynchro → merge → résolution → tests → tsc. Ne pas lancer les
  tests avant d'avoir résolu tous les conflits.
