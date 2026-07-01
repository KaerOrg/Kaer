import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, CalendarClock } from 'lucide-react'
import { useToast } from '../../../contexts/ToastContext'
import { Button } from '@ui/Button'
import { Chip } from '@ui/Chip'
import { InputField } from '@ui/InputField'
import { SpeechToTextButton } from '@ui/SpeechToTextButton'
import { Dropdown, type DropdownOption } from '@ui/Dropdown'
import type { AppointmentWithPatient } from '../../../lib/calendar.types'
import {
  saveNote,
  updateNote,
  deleteNote,
  extractUniqueTags,
  extractTopTags,
  selectableAppointmentsForNote,
  type PractitionerNote,
} from '@services/noteService'

const TYPEWRITER_CHAR_MS = 20

// Valeur sentinelle du filtre « notes libres » (sans RDV) : distincte de '' (= tous)
// et de tout id de rendez-vous.
const APPT_FILTER_UNLINKED = '__unlinked__'

type Props = {
  patientId: string
  practitionerId: string
  initialNotes: PractitionerNote[]
  appointments: AppointmentWithPatient[]
  onNotesChange: (notes: PractitionerNote[]) => void
}

export function PatientNotesTab({ patientId, practitionerId, initialNotes, appointments, onNotesChange }: Props) {
  const { t, i18n } = useTranslation()
  const toast = useToast()

  const [notes, setNotes] = useState<PractitionerNote[]>(initialNotes)
  const [savingNote, setSavingNote] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [editingTags, setEditingTags] = useState<string[]>([])
  const [editingTagInput, setEditingTagInput] = useState('')
  const [updatingNote, setUpdatingNote] = useState(false)
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const [newNoteTags, setNewNoteTags] = useState<string[]>([])
  const [newTagInput, setNewTagInput] = useState('')
  // RDV rattaché aux formulaires : '' = aucun (note libre), sinon id du RDV.
  const [newNoteAppointmentId, setNewNoteAppointmentId] = useState('')
  const [editingAppointmentId, setEditingAppointmentId] = useState('')
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null)
  const [tagSearch, setTagSearch] = useState('')
  // Filtre par RDV : '' = tous, APPT_FILTER_UNLINKED = notes libres, sinon id du RDV.
  const [apptFilter, setApptFilter] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  // Instant figé pour le mois de vie du formulaire : évite de recalculer la fenêtre
  // des RDV proposables à chaque rendu (la fenêtre est à l'échelle du jour).
  const now = useMemo(() => new Date(), [])

  // Lookup O(1) du RDV lié à une note pour l'affichage (la page charge tous les
  // RDV du patient).
  const appointmentById = useMemo(
    () => new Map(appointments.map(a => [a.id, a])),
    [appointments],
  )

  const formatAppointmentLabel = useCallback(
    (appt: AppointmentWithPatient) =>
      new Date(appt.starts_at).toLocaleString(i18n.language, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [i18n.language],
  )

  // Options du sélecteur de RDV : « Aucun » + les RDV proposables. La note en
  // cours d'édition force l'inclusion de son RDV d'origine (même hors fenêtre).
  const editingNote = useMemo(
    () => notes.find(n => n.id === editingNoteId) ?? null,
    [notes, editingNoteId],
  )

  const buildApptOptions = useCallback(
    (currentId: string | null): DropdownOption[] => [
      { value: '', label: t('notes.appointment_none') },
      ...selectableAppointmentsForNote(appointments, now, currentId).map(a => ({
        value: a.id,
        label: formatAppointmentLabel(a),
      })),
    ],
    [appointments, now, t, formatAppointmentLabel],
  )

  const newNoteApptOptions = useMemo(() => buildApptOptions(null), [buildApptOptions])
  const editApptOptions = useMemo(
    () => buildApptOptions(editingNote?.appointment_id ?? null),
    [buildApptOptions, editingNote],
  )

  // Options du filtre : « Tous » + (si présentes) « Notes libres » + un item par RDV
  // ayant au moins une note rattachée (RDV ordonnés du plus récent au plus ancien).
  const apptFilterOptions = useMemo<DropdownOption[]>(() => {
    const linkedIds = new Set(
      notes.map(n => n.appointment_id).filter((x): x is string => x !== null),
    )
    const opts: DropdownOption[] = [{ value: '', label: t('notes.filter_appointment_all') }]
    if (notes.some(n => n.appointment_id === null)) {
      opts.push({ value: APPT_FILTER_UNLINKED, label: t('notes.filter_appointment_unlinked') })
    }
    for (const a of appointments) {
      if (linkedIds.has(a.id)) opts.push({ value: a.id, label: formatAppointmentLabel(a) })
    }
    return opts
  }, [notes, appointments, t, formatAppointmentLabel])

  const newNoteRef = useRef<HTMLTextAreaElement>(null)
  const typewriterQueueRef = useRef<string[]>([])
  const isTypingRef = useRef(false)
  const typeNextCharRef = useRef<() => void>(() => {})

  const updateNotes = useCallback((updated: PractitionerNote[]) => {
    setNotes(updated)
    onNotesChange(updated)
  }, [onNotesChange])

  const typeNextChar = useCallback(() => {
    if (!newNoteRef.current || typewriterQueueRef.current.length === 0) {
      isTypingRef.current = false
      return
    }
    const segment = typewriterQueueRef.current[0]
    if (segment.length === 0) {
      typewriterQueueRef.current.shift()
      setTimeout(() => typeNextCharRef.current(), 0)
      return
    }
    newNoteRef.current.value += segment[0]
    typewriterQueueRef.current[0] = segment.slice(1)
    setTimeout(() => typeNextCharRef.current(), TYPEWRITER_CHAR_MS)
  }, [])

  useEffect(() => {
    typeNextCharRef.current = typeNextChar
  }, [typeNextChar])

  const handleTextChunk = useCallback((text: string) => {
    if (!newNoteRef.current) return
    const chunk = newNoteRef.current.value.trim() ? '\n' + text : text
    typewriterQueueRef.current.push(chunk)
    if (!isTypingRef.current) {
      isTypingRef.current = true
      typeNextChar()
    }
  }, [typeNextChar])

  const handleTranscription = useCallback(() => {}, [])
  const handleRecordingChange = useCallback((recording: boolean) => setIsRecording(recording), [])

  const addNewTag = () => {
    const tag = newTagInput.trim()
    if (tag && !newNoteTags.includes(tag)) setNewNoteTags(prev => [...prev, tag])
    setNewTagInput('')
  }

  const handleNewTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addNewTag() }
  }

  const addEditingTag = () => {
    const tag = editingTagInput.trim()
    if (tag && !editingTags.includes(tag)) setEditingTags(prev => [...prev, tag])
    setEditingTagInput('')
  }

  const handleEditingTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addEditingTag() }
  }

  const handleSaveNote = async () => {
    const content = newNoteRef.current?.value ?? ''
    if (!content.trim()) { setNoteError(t('notes.error_empty')); return }
    setSavingNote(true)
    setNoteError(null)
    const result = await saveNote(practitionerId, patientId, content, newNoteTags, newNoteAppointmentId || null)
    setSavingNote(false)
    if (result.ok && result.note) {
      const updated = [result.note, ...notes]
      updateNotes(updated)
      if (newNoteRef.current) newNoteRef.current.value = ''
      setNewNoteTags([])
      setNewTagInput('')
      setNewNoteAppointmentId('')
    } else {
      toast.error(t('notes.error_save'))
    }
  }

  const handleStartEditNote = (note: PractitionerNote) => {
    setEditingNoteId(note.id)
    setEditingContent(note.content)
    setEditingTags(note.tags)
    setEditingTagInput('')
    setEditingAppointmentId(note.appointment_id ?? '')
    setNoteError(null)
  }

  const handleCancelEditNote = () => {
    setEditingNoteId(null)
    setEditingContent('')
    setEditingTags([])
    setEditingTagInput('')
    setEditingAppointmentId('')
    setNoteError(null)
  }

  const handleUpdateNote = async () => {
    if (!editingNoteId) return
    if (!editingContent.trim()) { setNoteError(t('notes.error_empty')); return }
    setUpdatingNote(true)
    setNoteError(null)
    const nextAppointmentId = editingAppointmentId || null
    const result = await updateNote(editingNoteId, editingContent, editingTags, nextAppointmentId)
    setUpdatingNote(false)
    if (result.ok) {
      const updated = notes.map(n =>
        n.id === editingNoteId
          ? { ...n, content: editingContent.trim(), tags: editingTags, appointment_id: nextAppointmentId, updated_at: new Date().toISOString() }
          : n
      )
      updateNotes(updated)
      setEditingNoteId(null)
      setEditingContent('')
      setEditingTags([])
      setEditingAppointmentId('')
    } else {
      toast.error(t('notes.error_update'))
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId)
    const result = await deleteNote(noteId)
    if (result.ok) {
      const updated = notes.filter(n => n.id !== noteId)
      updateNotes(updated)
    }
    setConfirmDeleteNoteId(null)
    setDeletingNoteId(null)
  }

  const allTags = extractUniqueTags(notes)
  const topTags = extractTopTags(notes, 7)
  const visibleTags = tagSearch
    ? allTags.filter(tag => tag.toLowerCase().includes(tagSearch.toLowerCase())).slice(0, 7)
    : topTags
  // Filtre RDV (indépendant du filtre par tag) appliqué d'abord, puis le filtre par tag.
  const apptFilteredNotes = !apptFilter
    ? notes
    : apptFilter === APPT_FILTER_UNLINKED
      ? notes.filter(n => n.appointment_id === null)
      : notes.filter(n => n.appointment_id === apptFilter)
  const filteredNotes = activeTagFilter
    ? apptFilteredNotes.filter(n => n.tags.includes(activeTagFilter))
    : tagSearch
      ? apptFilteredNotes.filter(n => n.tags.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase())))
      : apptFilteredNotes

  return (
    <section className="patient-notes">
      {/* ── Formulaire nouvelle note ─────────────────────────── */}
      <div className="patient-notes__form">
        <div className={`patient-notes__textarea-frame ${isRecording ? 'patient-notes__textarea-frame--recording' : ''}`}>
          <div className="patient-notes__textarea-inner">
            {isRecording && (
              <div className="patient-notes__skeleton" aria-hidden="true">
                <div className="patient-notes__skeleton-line" />
                <div className="patient-notes__skeleton-line" />
                <div className="patient-notes__skeleton-line" />
              </div>
            )}
            <InputField
              multiline
              ref={newNoteRef}
              aria-label={t('notes.placeholder')}
              placeholder={t('notes.placeholder')}
              rows={3}
            />
          </div>
        </div>

        <div className="patient-notes__tag-actions-row">
          {newNoteApptOptions.length > 1 && (
            <div className="patient-notes__appt-select">
              <span className="patient-notes__appt-select-label">{t('notes.appointment_link_label')}</span>
              <div className="patient-notes__appt-select-field">
                <Dropdown
                  compact
                  searchable={false}
                  ariaLabel={t('notes.appointment_link_label')}
                  placeholder={t('notes.appointment_select_placeholder')}
                  options={newNoteApptOptions}
                  value={newNoteAppointmentId}
                  onChange={setNewNoteAppointmentId}
                />
              </div>
            </div>
          )}
          <div className="patient-notes__tag-row">
            {newNoteTags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                onRemove={() => setNewNoteTags(prev => prev.filter(t => t !== tag))}
                removeLabel={t('notes.tag_remove', { tag })}
              />
            ))}
            <input
              className="patient-notes__tag-input"
              value={newTagInput}
              onChange={e => setNewTagInput(e.target.value)}
              onKeyDown={handleNewTagKeyDown}
              onBlur={addNewTag}
              placeholder={t('notes.tag_placeholder')}
            />
          </div>
          <div className="patient-notes__form-actions">
            <SpeechToTextButton
              onTranscription={handleTranscription}
              onTextChunk={handleTextChunk}
              onRecordingChange={handleRecordingChange}
              disabled={savingNote}
            />
            <Button size="sm" loading={savingNote} onClick={handleSaveNote}>
              {t('notes.save_button')}
            </Button>
          </div>
        </div>

        {noteError && !editingNoteId && (
          <p className="patient-notes__error">{noteError}</p>
        )}
      </div>

      {/* ── Filtres (RDV + tags) ──────────────────────────────── */}
      {(apptFilterOptions.length > 1 || allTags.length > 0) && (
        <div className="patient-notes__filter-row">
          {apptFilterOptions.length > 1 && (
            <div className="patient-notes__appt-filter">
              <Dropdown
                compact
                searchable={false}
                ariaLabel={t('notes.filter_appointment_label')}
                options={apptFilterOptions}
                value={apptFilter}
                onChange={setApptFilter}
              />
            </div>
          )}
          {allTags.length > 0 && (
            <>
              <div className="patient-notes__filter-search-wrapper">
                <Search size={13} className="patient-notes__filter-icon" />
                <input
                  className="patient-notes__filter-search"
                  value={tagSearch}
                  onChange={e => {
                    const val = e.target.value
                    if (activeTagFilter && allTags.filter(tag => !val || tag.toLowerCase().includes(val.toLowerCase())).indexOf(activeTagFilter) === -1) {
                      setActiveTagFilter(null)
                    }
                    setTagSearch(val)
                  }}
                  placeholder={t('notes.tag_search_placeholder')}
                />
              </div>
              <Chip
                selectable
                selected={activeTagFilter === null}
                onClick={() => setActiveTagFilter(null)}
                label={t('notes.filter_clear')}
              />
              {visibleTags.map(tag => (
                <Chip
                  key={tag}
                  selectable
                  selected={activeTagFilter === tag}
                  onClick={() => setActiveTagFilter(prev => prev === tag ? null : tag)}
                  label={tag}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Liste de notes ────────────────────────────────────── */}
      {filteredNotes.length === 0 ? (
        <p className="patient-notes__empty">
          {apptFilter
            ? t('notes.empty_filtered_appointment')
            : activeTagFilter
              ? t('notes.empty_filtered')
              : t('notes.empty_state')}
        </p>
      ) : (
        <ul className="patient-notes__list">
          {filteredNotes.map(note => {
            const linkedAppt = note.appointment_id ? appointmentById.get(note.appointment_id) ?? null : null
            return (
            <li key={note.id} className="patient-notes__item">
              {editingNoteId === note.id ? (
                <div className="patient-notes__edit-form">
                  <InputField
                    multiline
                    aria-label={t('notes.placeholder')}
                    value={editingContent}
                    onChange={e => setEditingContent(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className="patient-notes__tag-row">
                    {editingTags.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        onRemove={() => setEditingTags(prev => prev.filter(t => t !== tag))}
                        removeLabel={t('notes.tag_remove', { tag })}
                      />
                    ))}
                    <input
                      className="patient-notes__tag-input"
                      value={editingTagInput}
                      onChange={e => setEditingTagInput(e.target.value)}
                      onKeyDown={handleEditingTagKeyDown}
                      onBlur={addEditingTag}
                      placeholder={t('notes.tag_placeholder')}
                    />
                  </div>
                  {editApptOptions.length > 1 && (
                    <div className="patient-notes__appointment-row">
                      <Dropdown
                        compact
                        searchable={false}
                        label={t('notes.appointment_link_label')}
                        placeholder={t('notes.appointment_select_placeholder')}
                        options={editApptOptions}
                        value={editingAppointmentId}
                        onChange={setEditingAppointmentId}
                      />
                    </div>
                  )}
                  {noteError && editingNoteId === note.id && (
                    <p className="patient-notes__error">{noteError}</p>
                  )}
                  <div className="patient-notes__item-actions">
                    <Button size="sm" loading={updatingNote} onClick={handleUpdateNote}>
                      {t('notes.save_button')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEditNote}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="patient-notes__item-content">{note.content}</p>
                  {note.tags.length > 0 && (
                    <div className="patient-notes__tag-row patient-notes__tag-row--readonly">
                      {note.tags.map(tag => (
                        <Chip key={tag} size="sm" label={tag} />
                      ))}
                    </div>
                  )}
                  <div className="patient-notes__item-meta">
                    <div className="patient-notes__item-meta-left">
                      <span className="patient-notes__item-date">
                        {new Date(note.created_at).toLocaleDateString(i18n.language, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      {linkedAppt && (
                        <span className="patient-notes__item-appointment">
                          <CalendarClock size={13} className="patient-notes__item-appointment-icon" />
                          {t('notes.linked_appointment', { date: formatAppointmentLabel(linkedAppt) })}
                        </span>
                      )}
                    </div>
                    <div className="patient-notes__item-actions">
                      {confirmDeleteNoteId === note.id ? (
                        <>
                          <span className="patient-notes__confirm-label">
                            {t('notes.confirm_delete')}
                          </span>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={deletingNoteId === note.id}
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            {t('notes.confirm_yes')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteNoteId(null)}
                          >
                            {t('common.cancel')}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEditNote(note)}
                          >
                            {t('notes.edit_button')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="patient-notes__delete-btn"
                            onClick={() => setConfirmDeleteNoteId(note.id)}
                          >
                            {t('notes.delete_button')}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
