import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface CalendarNote {
  id: string
  date: string
  title: string
  description: string | null
  created_at: string
}

export function useCalendar() {
  const [notes, setNotes] = useState<CalendarNote[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all notes
  const fetchNotes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('calendar_notes')
      .select('*')
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching calendar notes:', error)
    } else {
      setNotes(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Get notes for a specific date
  const getNotesForDate = useCallback((date: string) => {
    return notes.filter(n => n.date === date)
  }, [notes])

  // Add a note
  const addNote = async (date: string, title: string, description?: string) => {
    const { data, error } = await supabase
      .from('calendar_notes')
      .insert({ date, title, description })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    setNotes(prev => [...prev, data])
    return { data, error: null }
  }

  // Delete a note
  const deleteNote = async (id: string) => {
    const { error } = await supabase
      .from('calendar_notes')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    setNotes(prev => prev.filter(n => n.id !== id))
    return { error: null }
  }

  // Check if a date has notes
  const hasNotesOnDate = useCallback((date: string) => {
    return notes.some(n => n.date === date)
  }, [notes])

  return {
    notes,
    loading,
    getNotesForDate,
    addNote,
    deleteNote,
    hasNotesOnDate,
    refetch: fetchNotes
  }
}
