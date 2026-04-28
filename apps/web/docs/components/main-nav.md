# MainNav

Barre de navigation principale de l'interface praticien. Rendu dans `Layout`, à droite du logo PsyTool.

Chaque lien détecte automatiquement s'il est actif via `useLocation()` et applique la classe `.main-nav__link--active`.

**Ajouter un lien** : éditer `MainNav.tsx` — ajouter un `<Link>` avec le chemin de la nouvelle page.

## Liens actuels

| Label (`i18n`)        | Route      |
|-----------------------|------------|
| `dashboard.title`     | `/`        |
| `modules.nav_link`    | `/modules` |

## Aucune prop

`MainNav` ne prend aucune prop — la route active est lue depuis le contexte React Router.
