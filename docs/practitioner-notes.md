# Notes praticien par patient

## Résumé

Un praticien peut rédiger des notes libres liées à chacun de ses patients, directement depuis la fiche patient web. Ces notes sont **privées** (jamais accessibles au patient), **stockées en base Supabase**, et **protégées par RLS**.

## Règles métier

- Seul le praticien auteur peut lire, modifier ou supprimer ses notes.
- Le contenu est du texte libre — aucune interprétation clinique, aucun score, aucun seuil (conformité MDR 2017/745).
- Une note vide ne peut pas être enregistrée (validation côté service).
- La suppression est irréversible et requiert une confirmation explicite.
- Les notes sont affichées par ordre antéchronologique (plus récente en haut).
- Une note peut être **rattachée optionnellement à un rendez-vous** du patient, ou rester libre.

## Rattachement optionnel à un rendez-vous

Une note peut référencer un rendez-vous (`appointments`) du patient via la colonne nullable
`appointment_id` :

- `null` = note libre (comportement historique inchangé).
- renseigné = note rattachée à ce RDV ; le RDV lié est affiché sur la note (date et heure, affichage neutre et factuel).
- `on delete set null` : supprimer un rendez-vous **ne supprime pas** la note, elle redevient simplement libre.

Le sélecteur de RDV (formulaires de création et d'édition) ne propose que les rendez-vous
**proches** : non annulés et dans la fenêtre `[maintenant - 60 j, maintenant + 30 j]`
(constantes `NOTE_APPOINTMENT_PAST_DAYS` / `NOTE_APPOINTMENT_FUTURE_DAYS`). En édition, le RDV
déjà rattaché reste toujours proposé, même s'il est sorti de cette fenêtre. Une barre de filtre
permet de n'afficher que les notes d'un rendez-vous donné (ou les notes libres).

## Schéma de données

```sql
practitioner_patient_notes (
  id              uuid        PK
  practitioner_id uuid        FK practitioners (on delete cascade)
  patient_id      uuid        FK patients      (on delete cascade)
  appointment_id  uuid        FK appointments  (nullable, on delete set null) -- RDV optionnellement rattaché
  content         text        NOT NULL
  tags            text[]      NOT NULL default '{}'
  created_at      timestamptz
  updated_at      timestamptz -- mis à jour via trigger set_updated_at()
)
```

La contrainte FK `fk_ppnote_appointment` est ajoutée après la table `appointments` (définie
plus bas dans `schema.sql`). Index partiel `idx_ppnotes_appointment` sur `appointment_id`
(where not null).

RLS : les 4 opérations (select/insert/update/delete) sont restreintes à `auth.uid() = practitioner_id`.

## Couche service

`apps/web/src/services/noteService.ts`

| Fonction | Rôle |
|---|---|
| `fetchNotes(practitionerId, patientId)` | Liste les notes du patient (avec `appointment_id` et `tags`), ordre antéchronologique |
| `saveNote(practitionerId, patientId, content, tags?, appointmentId?)` | Crée une note (RDV optionnel) |
| `updateNote(noteId, content, tags, appointmentId?)` | Modifie contenu, tags et RDV rattaché |
| `deleteNote(noteId)` | Supprime définitivement une note |
| `selectableAppointmentsForNote(appointments, now, currentId?)` | Helper pur : RDV proposables au rattachement (fenêtre + non annulés + tri), `currentId` toujours inclus |

## Flux utilisateur

1. La section **Notes** s'affiche dans l'onglet *Notes* de la fiche patient.
2. Le praticien saisit du texte, choisit éventuellement un rendez-vous à rattacher, et clique sur **Enregistrer**.
3. La note apparaît en haut de la liste, horodatée, avec le RDV lié le cas échéant.
4. Cliquer sur **Modifier** ouvre le champ en mode édition inline (contenu, tags, RDV rattaché).
5. Cliquer sur **Supprimer** affiche une confirmation ; confirmer supprime définitivement.
6. Les barres de filtre permettent de restreindre la liste par tag et/ou par rendez-vous.

## Tests

- `apps/web/src/services/noteService.test.ts` (service et helper pur) :
  - happy path fetch / save / update / delete ; contenu vide → `{ ok: false }` sans appel Supabase ; erreur Supabase → `{ ok: false }` gracieux
  - `appointment_id` propagé à l'insert / l'update (null par défaut, RDV fourni, retour à null)
  - `selectableAppointmentsForNote` : fenêtre, exclusion des RDV hors fenêtre et annulés, tri antéchronologique, inclusion forcée du RDV déjà lié
- `apps/web/src/pages/PatientPage/tabs/PatientNotesTab.test.tsx` (composant) :
  - affichage du RDV rattaché, absence d'affichage sur une note libre, masquage du sélecteur sans RDV
  - enregistrement avec/sans RDV, filtre « Notes libres »
