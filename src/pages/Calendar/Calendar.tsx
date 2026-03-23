import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, Circle } from 'lucide-react'
import { useCalendar } from '../../hooks'
import './Calendar.css'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isFirstOfMonth: boolean
  monthLabel?: string
}

export default function Calendar() {
  const { notes, loading, addNote, deleteNote } = useCalendar()
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Current visible month for header
  const [visibleMonth, setVisibleMonth] = useState(new Date())
  const [showTodayBtn, setShowTodayBtn] = useState(false)
  
  // All calendar days (continuous flow)
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Generate calendar days for a range of months
  const generateDays = useCallback((startMonth: Date, endMonth: Date): CalendarDay[] => {
    const days: CalendarDay[] = []
    const current = new Date(startMonth.getFullYear(), startMonth.getMonth(), 1)
    const end = new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0)

    // Start from the Monday of the first week
    const firstDay = new Date(current)
    const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
    firstDay.setDate(firstDay.getDate() - startWeekday)

    while (firstDay <= end || days.length % 7 !== 0) {
      const isFirstOfMonth = firstDay.getDate() === 1
      const monthLabel = isFirstOfMonth 
        ? firstDay.toLocaleDateString('tr-TR', { month: 'short' })
        : undefined

      days.push({
        date: new Date(firstDay),
        isCurrentMonth: firstDay.getMonth() === current.getMonth() || 
                        (firstDay >= current && firstDay <= end),
        isFirstOfMonth,
        monthLabel
      })
      firstDay.setDate(firstDay.getDate() + 1)
    }

    return days
  }, [])

  // Initialize calendar and scroll to today
  useEffect(() => {
    const today = new Date()
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1) // Start from current month
    const endMonth = new Date(today.getFullYear(), today.getMonth() + 6, 1)
    setCalendarDays(generateDays(startMonth, endMonth))
    setVisibleMonth(today)
  }, [generateDays])

  // Auto-scroll to today's row on initial load
  useEffect(() => {
    if (calendarDays.length > 0 && containerRef.current) {
      // Delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        const container = containerRef.current
        const todayEl = document.querySelector('.calendar-day.today') as HTMLElement
        
        if (container && todayEl) {
          // Calculate scroll position to center today's row
          const containerHeight = container.clientHeight
          const todayOffsetTop = todayEl.offsetTop
          const todayHeight = todayEl.offsetHeight
          
          // Center the row containing today
          const scrollPosition = todayOffsetTop - (containerHeight / 2) + (todayHeight / 2)
          container.scrollTop = Math.max(0, scrollPosition)
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [calendarDays.length])

  // Handle scroll to detect current visible month
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const scrollTop = container.scrollTop
    const containerRect = container.getBoundingClientRect()

    // Find which row is at the top of the visible area
    let foundMonth: Date | null = null
    rowRefs.current.forEach((rowEl, key) => {
      const rect = rowEl.getBoundingClientRect()
      if (rect.top <= containerRect.top + 60 && rect.bottom > containerRect.top) {
        const [year, month] = key.split('-').map(Number)
        foundMonth = new Date(year, month, 1)
      }
    })

    if (foundMonth) {
      const fm = foundMonth as Date
      setVisibleMonth(fm)
      
      // Show floating today button if 2+ months away from current month
      const today = new Date()
      const monthDiff = Math.abs(
        (fm.getFullYear() - today.getFullYear()) * 12 + 
        (fm.getMonth() - today.getMonth())
      )
      setShowTodayBtn(monthDiff >= 2)
    }

    // Load more at bottom
    if (scrollTop + container.clientHeight >= container.scrollHeight - 200) {
      const lastDay = calendarDays[calendarDays.length - 1]?.date
      if (lastDay) {
        const newEndMonth = new Date(lastDay.getFullYear(), lastDay.getMonth() + 3, 1)
        const newDays = generateDays(
          new Date(lastDay.getFullYear(), lastDay.getMonth() + 1, 1),
          newEndMonth
        )
        setCalendarDays(prev => [...prev, ...newDays])
      }
    }
  }, [calendarDays, generateDays])

  // Format date to YYYY-MM-DD using local timezone (not UTC)
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getNotesForDate = (date: Date) => {
    const dateKey = formatDateKey(date)
    return notes.filter(n => n.date === dateKey)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString()
  }

  const handleAddNote = async () => {
    if (!selectedDate || !newTitle.trim()) {
      setError('Başlık gerekli')
      return
    }

    const { error: addError } = await addNote(
      formatDateKey(selectedDate),
      newTitle.trim(),
      newDescription.trim() || undefined
    )

    if (addError) {
      setError(addError)
    } else {
      setNewTitle('')
      setNewDescription('')
      setShowAddForm(false)
      setError(null)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId)
  }

  const scrollToToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setVisibleMonth(today)
    setSelectedDate(today) // Select today as well
    const todayEl = document.querySelector('.calendar-day.today')
    todayEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + direction, 1)
    setVisibleMonth(newMonth)
    
    // Find the first day of that month and scroll to it
    const dateKey = `${newMonth.getFullYear()}-${newMonth.getMonth()}`
    const row = rowRefs.current.get(dateKey)
    row?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const dayHeaders = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  // Group days into weeks
  const weeks: CalendarDay[][] = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  const selectedDateNotes = selectedDate ? getNotesForDate(selectedDate) : []

  return (
    <div className="calendar-page animate-slideUp">
      {/* Sticky Header */}
      <header className="calendar-header">
        <h1 className="month-title">
          {visibleMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
        </h1>
        <div className="calendar-nav">
          <button className="nav-btn" onClick={() => navigateMonth(-1)}>
            <ChevronLeft size={20} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={scrollToToday}>
            Bugün
          </button>
          <button className="nav-btn" onClick={() => navigateMonth(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="calendar-container">
        {/* Calendar Scroll Area */}
        <div className="calendar-scroll-area card">
          {/* Day Headers */}
          <div className="calendar-days-header">
            {dayHeaders.map(day => (
              <div key={day} className="day-header">{day}</div>
            ))}
          </div>

          {/* Continuous Calendar Grid */}
          <div 
            className="calendar-weeks"
            ref={containerRef}
            onScroll={handleScroll}
          >
            {weeks.map((week, weekIndex) => {
              // Check if this week contains the first of a month
              const firstOfMonthDay = week.find(d => d.isFirstOfMonth)
              const weekKey = firstOfMonthDay 
                ? `${firstOfMonthDay.date.getFullYear()}-${firstOfMonthDay.date.getMonth()}`
                : `week-${weekIndex}`

              return (
                <div 
                  key={weekIndex} 
                  className="calendar-week"
                  ref={el => {
                    if (el && firstOfMonthDay) {
                      rowRefs.current.set(weekKey, el)
                    }
                  }}
                >
                  {week.map((dayInfo, dayIndex) => {
                    const dateNotes = getNotesForDate(dayInfo.date)
                    const hasNote = dateNotes.length > 0
                    const isPastMonth = dayInfo.date.getMonth() !== visibleMonth.getMonth() &&
                                        dayInfo.date < new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`calendar-day 
                          ${isToday(dayInfo.date) ? 'today' : ''}
                          ${isSelected(dayInfo.date) ? 'selected' : ''}
                          ${hasNote ? 'has-note' : ''}
                          ${isPastMonth ? 'past-month' : ''}
                        `}
                        onClick={() => {
                          setSelectedDate(dayInfo.date)
                          setShowAddForm(false)
                        }}
                      >
                        <span className="day-number">
                          {dayInfo.isFirstOfMonth ? (
                            <>
                              {dayInfo.date.getDate()}{' '}
                              <span className="month-label">{dayInfo.monthLabel}</span>
                            </>
                          ) : (
                            dayInfo.date.getDate()
                          )}
                        </span>
                        {hasNote && (
                          <div className="note-dots">
                            {dateNotes.slice(0, 3).map((_, i) => (
                              <span key={i} className="note-dot"></span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Floating Today Button */}
          {showTodayBtn && (
            <button className="floating-today-btn" onClick={scrollToToday} title="Bugüne git">
              <Circle size={8} />
            </button>
          )}
        </div>

        {/* Notes Panel */}
        <div className="notes-panel card">
          <div className="notes-header">
            <h3>
              📝 {selectedDate 
                ? selectedDate.toLocaleDateString('tr-TR', { 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })
                : 'Tarih Seçin'}
            </h3>
            {selectedDate && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus size={16} />
                Not Ekle
              </button>
            )}
          </div>

          {/* Add Note Form */}
          {showAddForm && selectedDate && (
            <div className="add-note-form">
              {error && <div className="form-error">{error}</div>}
              <input
                type="text"
                className="form-input"
                placeholder="Başlık *"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <textarea
                className="form-input"
                placeholder="Açıklama (opsiyonel)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
              />
              <div className="form-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setShowAddForm(false)
                    setError(null)
                  }}
                >
                  İptal
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleAddNote}
                >
                  Kaydet
                </button>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="notes-list">
            {!selectedDate ? (
              <div className="empty-notes centered">
                <p>Takvimden bir tarih seçin</p>
              </div>
            ) : selectedDateNotes.length === 0 ? (
              <div className="empty-notes centered">
                <p>Bu tarihte not yok</p>
              </div>
            ) : (
              selectedDateNotes.map(note => (
                <div key={note.id} className="note-item">
                  <div className="note-content">
                    <h4>{note.title}</h4>
                    {note.description && <p>{note.description}</p>}
                  </div>
                  <button 
                    className="icon-btn danger"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
