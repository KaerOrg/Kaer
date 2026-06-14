import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { useToast } from '../../../contexts/ToastContext'
import { Button } from '../../../components/ui/Button'
import { Chip } from '../../../components/ui/Chip'
import { InputField } from '../../../components/ui/InputField'
import { SpeechToTextButton } from '../../../components/ui/SpeechToTextButton'
import {
  saveNote,
  updateNote,
  deleteNote,
  extractUniqueTags,
  extractTopTags,
  type PractitionerNote,
} from '../../../services/noteService'

const TYPEWRITER_CHAR_MS = 20

type Props = {
  patientId: string
  practitionerId: string
  initialNotes: PractitionerNote[]
  onNotesChange: (notes: PractitionerNote[]) => void
}

export function PatientNotesTab({ patientId, practitionerId, initialNotes, onNotesChange }: Props) {
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
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null)
  const [tagSearch, setTagSearch] = useState('')
  const [isRecording, setIsRecording] = useState(false)

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
    const result = await saveNote(practitionerId, patientId, content, newNoteTags)
    setSavingNote(false)
    if (result.ok && result.note) {
      const updated = [result.note, ...notes]
      updateNotes(updated)
      if (newNoteRef.current) newNoteRef.current.value = ''
      setNewNoteTags([])
      setNewTagInput('')
    } else {
      toast.error(t('notes.error_save'))
    }
  }

  const handleStartEditNote = (note: PractitionerNote) => {
    setEditingNoteId(note.id)
    setEditingContent(note.content)
    setEditingTags(note.tags)
    setEditingTagInput('')
    setNoteError(null)
  }

  const handleCancelEditNote = () => {
    setEditingNoteId(null)
    setEditingContent('')
    setEditingTags([])
    setEditingTagInput('')
    setNoteError(null)
  }

  const handleUpdateNote = async () => {
    if (!editingNoteId) return
    if (!editingContent.trim()) { setNoteError(t('notes.error_empty')); return }
    setUpdatingNote(true)
    setNoteError(null)
    const result = await updateNote(editingNoteId, editingContent, editingTags)
    setUpdatingNote(false)
    if (result.ok) {
      const updated = notes.map(n =>
        n.id === editingNoteId
          ? { ...n, content: editingContent.trim(), tags: editingTags, updated_at: new Date().toISOString() }
          : n
      )
      updateNotes(updated)
      setEditingNoteId(null)
      setEditingContent('')
      setEditingTags([])
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
  const filteredNotes = activeTagFilter
    ? notes.filter(n => n.tags.includes(activeTagFilter))
    : tagSearch
      ? notes.filter(n => n.tags.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase())))
      : notes

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

      {/* ── Filtre par tag ────────────────────────────────────── */}
      {allTags.length > 0 && (
        <div className="patient-notes__filter-row">
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
        </div>
      )}

      {/* ── Liste de notes ────────────────────────────────────── */}
      {filteredNotes.length === 0 ? (
        <p className="patient-notes__empty">
          {activeTagFilter ? t('notes.empty_filtered') : t('notes.empty_state')}
        </p>
      ) : (
        <ul className="patient-notes__list">
          {filteredNotes.map(note => (
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
                    <span className="patient-notes__item-date">
                      {new Date(note.created_at).toLocaleDateString(i18n.language, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
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
          ))}
        </ul>
      )}
    </section>
  )
}
