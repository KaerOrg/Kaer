# Module : Tolérance à la détresse (`distress_tolerance`)

## Résumé

Module psychoéducatif issu de la DBT (Thérapie Dialectique Comportementale, Marsha Linehan). Deux onglets :
- **Fiches** — 6 fiches psychoéducatives complètes (intro + 5 techniques)
- **En crise** — accès rapide aux techniques sous forme de cartes accordéon consultables en situation de détresse aiguë

## Conformité MDR

Aucun score, aucun seuil, aucun calcul, aucune interprétation automatique. Contenu passif uniquement.
Bandeau disclaimer visible en permanence dans les deux onglets.

## Architecture

| Fichier | Rôle |
|---|---|
| `DistressToleranceScreen.tsx` | Écran principal — segment control Fiches / En crise + bandeau disclaimer |
| `DistressToleranceDetailScreen.tsx` | Détail d'une fiche (BlockRenderer) |
| `supabase/seed/distress_tolerance_seed.sql` | Seed idempotent — 6 topics + blocs |
| `i18n/locales/fr/psyedu.json` | Namespace `distress_tolerance` (vouvoiement) |
| `i18n/locales/fr/psyedu_teen.json` | Surcharges tutoiement |
| `i18n/locales/fr/common.json` | Labels, tabs, disclaimer adulte |
| `i18n/locales/fr/teen.json` | Disclaimer tutoiement |

## Topics (6 fiches)

| `topic_key` | Titre | Onglet En crise |
|---|---|---|
| `intro` | Qu'est-ce que la tolérance à la détresse ? | Non (fiche pédagogique uniquement) |
| `tipp` | TIPP — Régulation physique rapide | Oui |
| `accepts` | ACCEPTS — Distraction structurée | Oui |
| `self_soothing` | Self-soothing — Apaiser les 5 sens | Oui |
| `improve` | IMPROVE — Ressources intérieures | Oui |
| `pros_cons` | Pros & cons — Avant d'agir | Oui |

## Onglet "En crise" — fonctionnement

- Les blocs sont chargés **une seule fois** lors du premier affichage de l'onglet (ref `crisisLoadedRef`).
- Seuls les blocs `section_key === 'how'` sont affichés (étapes pratiques).
- Les blocs `block_type === 'heading'` sont filtrés pour alléger l'affichage accordion.
- Le topic `intro` est exclu de l'onglet En crise (`topic_key !== 'intro'`).

## Teen mode

Couleur accent : `#FF4D6D` (définie dans `teen.ts`).
Disclaimer tutoiement dans `teen.json → modules.distress_tolerance.disclaimer`.
Surcharges de contenu dans `psyedu_teen.json → distress_tolerance.*`.

## Sources cliniques

- Linehan MM (1993) — Cognitive-Behavioral Treatment of Borderline Personality Disorder. Guilford Press.
- Linehan MM (2015) — DBT Skills Training Manual, 2nd ed. Guilford Press.
- Recommandé en 1ère ligne par la HAS pour le trouble de personnalité borderline.
- Classé "well-established treatment" par l'APA.
