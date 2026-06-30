# Observabilité du moteur de rendu (issue #90)

> **Objectif : zéro non-match silencieux.** Quand le moteur de rendu rencontre une
> config qu'il ne sait pas afficher (`preview_kind` / `widget_type` orphelin), l'équipe
> est **alertée** (email + journal persisté) et le problème est **attrapé en CI** quand
> c'est possible — au lieu d'un écran vide silencieux côté patient.

## Principe de conception — détecteur PUR à la frontière des données

Un non-match est une **propriété pure** de `(config DB) × (capacités du moteur)` : il se
calcule **sans rien rendre**. L'observabilité n'est donc PAS dispersée dans les composants
de rendu (pas de hook dans `FieldText`, `FieldWidget`, etc.) — elle est centralisée en
**une fonction pure partagée**, appelée **une seule fois par app**, au chargement d'un
module.

```
moduleService.fetchModuleFields(moduleId)          ← UN seul point de câblage par app
   │  (chokepoint : tout chargement de module y passe)
   ▼
collectRenderMismatches(preview_kind, fields)      ← fonction PURE (@kaer/shared, web ≡ mobile)
   │  → RenderMismatchDescriptor[]
   ▼
renderDiagnosticsService.reportRenderMismatch(d)   ← fire-and-forget, ajoute platform + app_version
   │  mobile : persiste dans render_mismatch_outbox (SQLite) puis flush au retour réseau
   ▼
Edge Function report-render-mismatch
   │  validatePayload → computeSignature → dédup + cooldown + coupe-circuit
   ▼
   ├── render_mismatch_log (Supabase)              ← source de vérité + historique
   └── email Resend → guillaume.zarb@gmail.com     ← 1ʳᵉ occurrence d'une signature
```

> Le rendu (`FieldRenderer`, `LayoutDispatcher`, layouts, feuilles) n'a **aucune**
> connaissance de l'observabilité : il est resté purement présentationnel.

## Périmètre du détecteur runtime — et pourquoi

Le détecteur runtime couvre les niveaux **parfaitement ancrés et sans énumération** :

| `level` | Source de capacité (unique, partagée) |
|---|---|
| `preview_kind` | `PREVIEW_KINDS` (`@kaer/shared`) — dont dérive aussi le type `PreviewKind` |
| `widget_type` | `RENDERABLE_WIDGET_TYPES` (`@kaer/shared`) = `{ text, info }` |

Les niveaux **contextuels** (`field_type`, `missing_text_code`) dépendent du layout
courant et **divergent web/mobile** (ex. `scale_meta` est rendu côté web praticien, pas
côté patient). Les énumérer dans le détecteur runtime recréerait un **registre parallèle**
fragile → risque de **faux positifs** (email pour un module qui marche). Ils sont donc
attrapés par la **garde CI statique** (cf. plus bas), où un orphelin échoue le **build en
dev**, jamais un email en prod. Sur le web, un `field_type` orphelin reste de toute façon
**visible** (badge `FieldError`).

## Conformité MDR / RGPD

Le rapport ne contient **aucune donnée patient** : uniquement de la config structurelle
(`platform`, `app_version`, `level`, `module_id`, `preview_kind`, `field_id`,
`field_type`, `widget_type`, `reason`, horodatages). **Télémétrie technique**, hors
périmètre « donnée de santé ». La file mobile ne passe donc PAS par `syncHelpers`/
`patient_entries` ni par la gate de consentement (exception légitime documentée dans
`sync-service.md`).

## Stratégie anti-flood (dans l'edge function)

La dédup vit **côté edge function** (chaque patient est un client distinct ; une dédup
côté app ne dédupe qu'au sein d'une session).

1. **Déduplication par signature** — `platform + module_id + preview_kind + field_type +
   widget_type + reason`. 1ʳᵉ occurrence → insert + email ; suivantes → `occurrence_count++`
   + `last_seen_at`, **pas d'email**. 50 patients sur le même module cassé = **1 email +
   1 ligne (count=50)**.
2. **Cooldown** par signature (défaut 24 h, `RENDER_MISMATCH_COOLDOWN_MS`).
3. **Coupe-circuit global** (défaut ~20 emails/h) : au-delà, l'email est suspendu mais la
   table continue de tout enregistrer.

## Table `render_mismatch_log`

Source de vérité (`supabase/schema.sql`). Colonnes clés : `signature` (UNIQUE, pilote
l'upsert), `occurrence_count`, `occurred_at` / `last_seen_at`, `email_sent_at` (pilote le
cooldown). **RLS** : insert/update réservés à l'edge function (service_role) ; `select`
réservé aux praticiens admin (`fn_is_admin()`).

## Garde CI (prévention avant la prod — filet PRINCIPAL)

`apps/web/src/components/features/ModuleRenderer/FieldRenderer/previewKindCoverage.test.ts`
scanne les seeds et confronte, depuis les **mêmes sources uniques** que le détecteur :

- chaque `modules.preview_kind` à `PREVIEW_KINDS` ;
- chaque `field_props.widget_type` à `RENDERABLE_WIDGET_TYPES`.

Tout orphelin **échoue le build**. L'email runtime est le dernier recours (config modifiée
en base après déploiement), pas le filet principal.

> Pourquoi les capacités sont en code et non en base : un `preview_kind`/`widget_type`
> n'existe que s'il a un **composant** pour le rendre. La liste des kinds *supportés*
> change donc à la vitesse du **code**. La base dit *ce que chaque module veut* ; le code
> dit *ce que le moteur sait faire* ; la garde vérifie que le premier ⊆ le second (lire la
> liste depuis la base serait circulaire).

## Source unique partagée (`@kaer/shared`)

- `PREVIEW_KINDS` — tableau des `preview_kind` connus ; `PreviewKind = typeof PREVIEW_KINDS[number]`.
- `FIELDLESS_LAYOUTS` — set des layouts rendables sans field (importé par les 2 dispatchers).
- `RENDERABLE_WIDGET_TYPES` — widgets rendus par `FieldWidget`.
- `collectRenderMismatches(preview_kind, fields)` — détecteur pur.
- `RenderMismatch` / `RenderMismatchLevel` / `RenderMismatchDescriptor` — types de télémétrie.

## Fichiers

| Rôle | Fichier |
|---|---|
| Types + sources uniques + **détecteur pur** | `packages/shared/src/index.ts` + `packages/shared/src/services/renderDiagnostics.ts` |
| Câblage (1 par app, frontière de données) | `apps/<app>/src/services/moduleService.ts` (`fetchModuleFields`) |
| Table + RLS | `supabase/schema.sql` (`render_mismatch_log`) |
| Edge function (logique pure + handler) | `supabase/functions/report-render-mismatch/{logic,index}.ts` |
| Service émetteur web | `apps/web/src/services/renderDiagnosticsService.ts` |
| Service émetteur mobile (+ outbox offline) | `apps/mobile/src/services/renderDiagnosticsService.ts` + `apps/mobile/src/lib/renderMismatchOutbox.ts` |
| Garde CI (preview_kind + widget_type) | `.../FieldRenderer/previewKindCoverage.test.ts` |

## Variables d'environnement (edge function)

| Variable | Défaut | Rôle |
|---|---|---|
| `RENDER_MISMATCH_EMAIL` (ou `DEV_EMAIL`) | `guillaume.zarb@gmail.com` | Destinataire(s) des alertes |
| `RESEND_API_KEY` | — | Clé Resend (sans elle : log en table, pas d'email) |
| `RENDER_MISMATCH_COOLDOWN_MS` | `86400000` (24 h) | Fenêtre de silence par signature |
| `RENDER_MISMATCH_CIRCUIT_MAX` | `20` | Plafond d'emails par fenêtre |
| `RENDER_MISMATCH_CIRCUIT_WINDOW_MS` | `3600000` (1 h) | Fenêtre du coupe-circuit |

> ⚠️ Resend exige un **domaine vérifié** pour envoyer à une adresse arbitraire ; le
> domaine de test n'envoie qu'au propriétaire du compte Resend. À vérifier au branchement.
