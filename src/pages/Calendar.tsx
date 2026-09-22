import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useActivities, useTasks } from '@/hooks/useActivities'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ActivityList } from '@/components/activities/ActivityList'
import type { Activity } from '@/types/activity'

const TYPE_COLORS: Record<string, string> = {
  call: 'bg-blue-400',
  email: 'bg-purple-400',
  meeting: 'bg-emerald-400',
  note: 'bg-slate-400',
  task: 'bg-amber-400',
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []

  // Padding at start (days from previous month)
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(new Date(year, month, -i))
  }
  days.reverse()

  // Days in current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  // Padding at end to complete the last week
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i))
    }
  }

  return days
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function CalendarPage() {
  usePageTitle('Calendar')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const activitiesQuery = useActivities()
  const tasksQuery = useTasks()

  const activities = activitiesQuery.data ?? []
  const tasks = tasksQuery.data ?? []

  const calendarDays = getCalendarDays(year, month)

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
    setSelectedDay(null)
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
    setSelectedDay(null)
  }

  function goToday() {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setSelectedDay(null)
  }

  function getEventsForDay(day: Date): Activity[] {
    const dayStr = toDateStr(day)
    const dayActivities = activities.filter(
      (a) => a.createdAt.slice(0, 10) === dayStr,
    )
    const dayTasks = tasks.filter((t) => t.dueDate === dayStr)
    // Merge and deduplicate
    const merged = [...dayActivities]
    for (const task of dayTasks) {
      if (!merged.find((a) => a.id === task.id)) {
        merged.push(task)
      }
    }
    return merged
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Calendar</h2>
          <p className="mt-1 text-sm text-slate-500">
            Activities and tasks by date.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
            {/* Month navigation */}
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-slate-900">
                  {MONTHS[month]} {year}
                </h3>
                <button
                  type="button"
                  onClick={goToday}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Today
                </button>
              </div>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Weekday headers — shorten to single letter on mobile */}
            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day[0]}</span>
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.getMonth() === month
                const isToday = isSameDay(day, now)
                const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
                const dayEvents = isCurrentMonth ? getEventsForDay(day) : []
                const showDots = dayEvents.slice(0, 3)
                const extraCount = dayEvents.length - 3

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => isCurrentMonth && setSelectedDay(day)}
                    className={[
                      'relative min-h-[48px] border-b border-r border-border p-1 text-left transition-colors sm:min-h-[72px] sm:p-1.5',
                      isCurrentMonth
                        ? 'cursor-pointer hover:bg-slate-50'
                        : 'cursor-default opacity-40',
                      isSelected ? 'bg-brand-50' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span
                      className={[
                        'flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium sm:h-6 sm:w-6 sm:text-sm',
                        isToday ? 'bg-brand-600 text-white' : 'text-slate-700',
                        isSelected && !isToday ? 'bg-brand-100 text-brand-700' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {day.getDate()}
                    </span>
                    {dayEvents.length > 0 && isCurrentMonth ? (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {showDots.map((event) => (
                          <span
                            key={event.id}
                            className={[
                              'h-1.5 w-1.5 rounded-full',
                              TYPE_COLORS[event.type] ?? 'bg-slate-400',
                            ].join(' ')}
                          />
                        ))}
                        {extraCount > 0 ? (
                          <span className="text-[10px] text-slate-400">+{extraCount}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Day panel */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          {selectedDay ? (
            <>
              <h3 className="text-sm font-semibold text-slate-900">
                Activities on{' '}
                {selectedDay.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              {activitiesQuery.isLoading ? (
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
                  ))}
                </div>
              ) : selectedDayEvents.length > 0 ? (
                <div className="mt-4">
                  <ActivityList activities={selectedDayEvents} />
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">
                  No activities on this day.
                </p>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-slate-400">
                Click on a day to see its activities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
