# Module — Mon plan de sécurité (`crisis_plan`)

> **Renommage.** Le module s'appelle « Mon plan de sécurité » (ex « Plan de crise »).
> Le `module_id` en base reste **`crisis_plan`** : c'est une clé de persistance
> (`plan_items.module_id`, `crisis_plan_configs`, les `text_code`, la RLS). Seuls les
> libellés i18n changent. Le renommage complet des libellés est porté par P-2.

## Base clinique

- **Safety Planning Intervention** — Stanley & Brown, modèle en **six étapes**
  (signes d'alerte → stratégies internes → personnes et lieux de diversion → proches à
  contacter → professionnels → mise à distance des moyens).
- **NICE NG225** (2022) : le plan est **co-construit** avec la personne **et revu à
  chaque contact**.
- **À qui** : adultes et adolescents (mode ado). Construit en consultation, utilisé
  seul entre les séances.

### Droit d'auteur : à lire avant d'écrire un libellé

Le **formulaire** Stanley-Brown est sous copyright (2008, 2021) ; son usage dans un
dossier médical électronique exige une autorisation écrite. La **méthode** (les six
étapes, cet ordre, cette logique d'escalade) n'est pas protégée et se cite librement.

**Kær utilise ses propres formulations** et cite la méthode comme une source. Ne jamais
reprendre les phrases du formulaire, ni les reformuler légèrement : juridiquement ça
reste dérivé, et cliniquement on perd la seule raison de les vouloir, qu'elles aient
été éprouvées.

## Conformité MDR 2017/745

- **La Séquence n'écrit rien.** Aucun compteur d'ouverture, aucune durée, aucune trace,
  rien côté praticien. Corollaire assumé : on ne saura pas si la Séquence sert.
  L'évaluation appartient à la consultation.
- **Sauter une étape vide est licite, lire son contenu ne l'est pas.** Le routage se
  décide sur « existe-t-il quelque chose à afficher ? », jamais sur le nombre d'items
  au-delà de zéro, leurs mots ou leur nature.
- Aucun élément déclenché par une donnée patient : ni alerte, ni score, ni seuil, ni
  couleur de gravité, ni rappel d'échéance. Les dates de l'étape 6 sont **affichées,
  jamais surveillées**.
- **L'interface ne nomme, ne liste, ne suggère et n'illustre jamais un moyen.** Les
  propositions de l'étape 6 portent sur le **verbe** ; l'objet n'existe qu'en texte
  libre saisi par le patient.
- **Lexique** (programme Papageno, OMS 2023) : *mourir par suicide*, *tentative de
  suicide*, *une personne qui pense au suicide*.

## Architecture — trois vues, deux portes

L'édition est un **état**, jamais une porte : les deux entrées de l'accueil servent
deux intentions distinctes, pas deux contenus.

```
ACCUEIL
├── « Je suis en crise »        → SÉQUENCE      (safety_sequence)
└── « Mon plan de sécurité »    → CONSULTATION  (safety_plan)
                                    ├── « Modifier »         → ÉDITION (editable_steps)
                                    └── « Je suis en crise »  → SÉQUENCE
```

| Vue | `preview_kind` | Rôle |
|---|---|---|
| Séquence | `safety_sequence` | Traversée guidée en crise, une chose à la fois |
| Consultation | `safety_plan` | Relire son plan à froid, six étapes dépliées |
| Édition | `editable_steps` | Modifier le plan |

## La Séquence (`safety_sequence`)

### Machine à états

`home` → `step[n]` → `resources` → `closing`

Un **seul** bouton d'avancement (« Autre chose que j'ai prévu »), et c'est structurant :
un choix « ça m'aide / ça ne suffit pas » demanderait au patient de juger son état six
fois, dans le moment où juger est le plus dégradé. Effet de bord décisif : **plus aucun
jugement d'efficacité n'existe, donc plus rien à ne pas enregistrer** — le risque
réglementaire disparaît à la racine au lieu d'être géré par une règle de non-stockage.

Trois contrôles distincts, à ne pas confondre :

| Contrôle | Effet |
|---|---|
| Bouton primaire | Avance d'un écran. Sur la **dernière** étape affichée, son libellé devient « Ce qui est disponible tout de suite » : il ne promet plus « autre chose que j'ai prévu », qui serait faux |
| Retour discret | Recule d'un écran. **Obligatoire** : un appui accidentel ne doit pas coûter une étape définitivement. C'est l'argument qui écarte le geste de balayage |
| « Je m'arrête là » | **Sort** du parcours, sans confirmation, depuis n'importe quel écran |

### Logique pure partagée

`packages/shared/src/services/safetySequence.ts` — consommée par le layout mobile
(parcours patient) **et** le layout web (aperçu praticien). Une seule source, donc
aucune dérive de numérotation possible entre les deux plateformes.

**L'invariant MDR est porté par les signatures, pas par une convention** :
`buildDisplayableSteps` reçoit un `ReadonlySet<string>` des sections non vides, jamais
les items. Lire le contenu pour décider du parcours devient impossible à écrire.
Ne jamais élargir ces paramètres à `PlanItem[]`.

| Fonction | Rôle |
|---|---|
| `buildDisplayableSteps(ordre, sectionsNonVides)` | Étapes retenues + rang recalculé après retrait des vides |
| `advance(state, total)` | Écran suivant. Depuis un plan vide, mène directement aux ressources |
| `goBack(state, total)` | Écran précédent, ou `null` quand il n'y a plus de retour |
| `isLastStep(index, total)` | Pilote le changement de libellé du bouton primaire |
| `formatProgress(index, total)` | « n / m ». Chaîne vide s'il n'y a rien à numéroter |

### Zéro persistance, verrouillé par les tests

Trois garde-fous, dont un statique :

1. Une traversée complète ne déclenche ni `enqueue`, ni `savePlanItem`, ni `deletePlanItem`.
2. Le plan n'est lu qu'une fois, et jamais réécrit.
3. **Test statique** : le source du layout est relu et le test échoue si un import de
   service d'écriture y apparaît. Le test runtime ne verrait pas un appel placé derrière
   une branche non parcourue ; celui-ci le voit.

### Hors ligne

Le plan est lu depuis SQLite (`getPlanItems`) : la Séquence fonctionne sans réseau.
C'est une garantie, pas un chantier — les moments où un plan de sécurité est le plus
nécessaire coïncident avec ceux où le réseau est le plus défaillant.

## Données

`plan_items` (SQLite mobile) — `id`, `module_id`, `section_id`, `text`, `sort_order`,
`weight`, `phone`, `contact_source`, `created_at`.

> ⚠️ **Il n'existe pas de table `plan_items` côté Supabase.** Elle est locale au
> téléphone ; le serveur reçoit les items dans `patient_entries.payload` (jsonb opaque),
> poussés par `syncUpsert` avec `entry_kind: 'plan_item'`. Ce modèle est appelé à
> changer : `PW-1` sort le plan de `patient_entries` pour lui donner une table dédiée
> avec RLS dans les deux sens, parce que `RemoteSyncService` est strictement montant et
> qu'un item écrit depuis le web n'atteindrait jamais le téléphone.

## Fichiers

| Rôle | Chemin |
|---|---|
| Logique pure partagée | `packages/shared/src/services/safetySequence.ts` |
| Layout Séquence (mobile) | `apps/mobile/src/components/features/ModuleRenderer/layouts/SafetySequence/` |
| Layout Séquence (web) | `apps/web/src/components/features/ModuleRenderer/layouts/SafetySequenceLayout/` |
| Layout Consultation (mobile) | `.../layouts/SafetyPlan/` |
| Layout Édition (mobile) | `.../layouts/EditableSteps/` |
| Service items | `apps/mobile/src/services/planItemService.ts` |
| Bascule d'ouverture | `apps/mobile/src/screens/modules/ModuleContentScreen/initialPreviewKind.ts` |

## Voir aussi

- [`docs/module-engine.md`](../module-engine.md) — inventaire des `preview_kind`
- [`docs/spec/distress-tolerance-crisis.md`](../spec/distress-tolerance-crisis.md) — § 6,
  le raisonnement réglementaire du patron `crisis_companion` dont la Séquence hérite
