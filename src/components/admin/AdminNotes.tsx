'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { MessageSquare, Send, Trash2 } from 'lucide-react'

interface AdminNote {
  id: string
  entity_type: 'law_firm' | 'user' | 'order'
  entity_id: string
  author_id: string
  note: string
  created_at: string
  author?: { full_name: string; email: string }
}

interface AdminNotesProps {
  entityType: 'law_firm' | 'user' | 'order'
  entityId: string
}

export function AdminNotes({ entityType, entityId }: AdminNotesProps) {
  const { profile } = useAuth()
  const [notes, setNotes] = useState<AdminNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      fetchNotes()
    }
  }, [entityId, isAdmin])

  async function fetchNotes() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('admin_notes')
      .select('*, author:profiles!author_id(full_name, email)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setNotes(data as AdminNote[])
    }
    setLoading(false)
  }

  async function addNote() {
    if (!newNote.trim() || !isAdmin || !profile) return

    setSubmitting(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('admin_notes')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        author_id: profile.id,
        note: newNote.trim(),
      })
      .select('*, author:profiles!author_id(full_name, email)')
      .single()

    if (!error && data) {
      setNotes([data as AdminNote, ...notes])
      setNewNote('')
    }
    setSubmitting(false)
  }

  async function deleteNote(noteId: string) {
    if (!isAdmin) return
    if (!confirm('Delete this note?')) return

    const supabase = createClient()
    const { error } = await supabase.from('admin_notes').delete().eq('id', noteId)

    if (!error) {
      setNotes(notes.filter((n) => n.id !== noteId))
    }
  }

  if (!isAdmin) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-3">
        <MessageSquare size={16} />
        Internal Admin Notes
      </h3>

      {/* Add Note Form */}
      <div className="flex gap-2 mb-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add an internal note..."
          className="flex-1 px-3 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          rows={2}
        />
        <button
          onClick={addNote}
          disabled={submitting || !newNote.trim()}
          className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add Note"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Notes List */}
      {loading ? (
        <p className="text-sm text-amber-600">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-amber-600">No notes yet</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-lg p-3 border border-amber-200">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">{note.note}</p>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded shrink-0"
                  title="Delete Note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span>{note.author?.full_name || 'Unknown'}</span>
                <span>-</span>
                <span>{new Date(note.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
