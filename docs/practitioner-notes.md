# Notes praticien par patient

## Résumé

Un praticien peut rédiger des notes libres liées à chacun de ses patients, directement depuis la fiche patient web. Ces notes sont **privées** (jamais accessibles au patient), **stockées en base Supabase**, et **protégées par RLS**.

## Règles métier

- Seul le praticien auteur peut lire, modifier ou supprimer ses notes.
- Le contenu est du texte libre — aucune interprétation clinique, aucun score, aucun seuil (conformité MDR 2017/745).
- Une note vide ne peut pas être enregistrée (validation côté service).
- La suppression est irréversible et requiert une confirmation explicite.
- Les notes sont affichées par ordre antéchronologique (plus récente en haut).

## Schéma de données

```sql
practitioner_patient_notes (
  id              uuid        PK
  practitioner_id uuid        FK practitioners
  patient_id      uuid        FK patients
  content         text        NOT NULL
  created_at      timestamptz
  updated_at      timestamptz -- mis à jour via trigger set_updated_at()
)
```

RLS : les 4 opérations (select/insert/update/delete) sont restreintes à `auth.uid() = practitioner_id`.

## Couche service

`apps/web/src/services/noteService.ts`

| Fonction | Rôle |
|---|---|
| `fetchNotes(practitionerId, patientId)` | Liste les notes du patient, ordre antéchronologique |
| `saveNote(practitionerId, patientId, content)` | Crée une nouvelle note |
| `updateNote(noteId, content)` | Modifie le contenu d'une note existante |
| `deleteNote(noteId)` | Supprime définitivement une note |

## Flux utilisateur

1. La section **Notes** s'affiche entre l'en-tête patient et l'armoire thérapeutique.
2. Le praticien saisit du texte dans le champ libre et clique sur **Enregistrer**.
3. La note apparaît en haut de la liste, horodatée.
4. Cliquer sur **Modifier** ouvre le champ en mode édition inline.
5. Cliquer sur **Supprimer** affiche une confirmation ; confirmer supprime définitivement.

## Tests

`apps/web/src/services/noteService.test.ts` — 11 cas :
- happy path fetch / save / update / delete
- contenu vide → `{ ok: false }` sans appel Supabase
- erreur Supabase → `{ ok: false }` gracieux
