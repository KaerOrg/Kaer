# Balance Motivationnelle (`motivational_balance`)

## Référence clinique

**Technique** : Entretien Motivationnel — Balance décisionnelle et ambivalence au changement  
**Référence principale** : Miller WR & Rollnick S (2013). *Motivational Interviewing: Helping People Change.* 3e éd. Guilford Press.  
**Indications principales** :
- Ambivalence au changement (addictions, observance médicamenteuse, modification des habitudes de vie)
- Préparation au changement (modèle transthéorique de Prochaska & DiClemente)
- Soutien à la motivation intrinsèque en psychiatrie et en médecine générale

**Principe** : Fournir au patient une psychoéducation sur les mécanismes de l'ambivalence (pour/contre du statu quo et du changement) et l'accompagner dans l'exploration de ses valeurs comme levier de changement. Les fiches présentent le cadre théorique ; le travail d'application se fait avec le praticien en consultation.

---

## Conformité MDR 2017/745

- Contenu psychoéducatif uniquement — aucun score calculé
- Aucune recommandation automatique issue des données saisies
- L'interprétation de l'ambivalence et la décision appartiennent exclusivement au patient et au soignant

---

## Architecture technique

### Stockage

Aucune donnée locale stockée — contenu psychoéducatif uniquement.  
Les topics et blocs sont lus depuis Supabase (`psyedu_topics` + `psyedu_blocks`).

### Moteur générique

`preview_kind = 'tabbed'`

### Fiches psychoéducatives (`psyedu_topics`)

| # | `topic_key` | Icône | Contenu |
|---|---|---|---|
| 1 | `ambivalence` | Scale | Comprendre l'ambivalence au changement |
| 2 | `stages_of_change` | RotateCcw | Stades de changement (Prochaska & DiClemente) |
| 3 | `values_and_change` | Heart | Valeurs personnelles comme moteur du changement |
| 4 | `change_talk` | MessageCircle | Le discours-changement (change talk) en entretien motivationnel |

### Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/seed/psyedu_seed.sql` | Seed `motivational_balance` topics + blocs (idempotent) |
| `apps/mobile/src/services/psyeduService.ts` | `fetchTopicsByModule('motivational_balance')` |
| `apps/mobile/src/components/features/ModuleRenderer/FieldRenderer.tsx` | Rendu `preview_kind='tabbed'` |
| `apps/mobile/src/i18n/locales/fr/psyedu.json` | Namespace `motivational_balance` (vouvoiement) |
| `apps/mobile/src/i18n/locales/fr/psyedu_teen.json` | Surcharges tutoiement |
| `apps/web/src/lib/modulePreviewContent.ts` | Aperçu praticien |
