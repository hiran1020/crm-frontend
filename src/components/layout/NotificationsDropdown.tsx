import { Bell, CheckSquare } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTasks } from '@/hooks/useActivities'
import type { Activity } from '@/types/activity'

function groupTasks(tasks: Activity[]) {
  const today = new Date().toISOString().slice(0, 10)
  const overdue: Activity[] = []
  const dueToday: Activity[] = []

  for (const task of tasks) {
    if (task.completed || !task.dueDate) continue
    if (task.dueDate < today) overdue.push(task)
    else if (task.dueDate === today) dueToday.push(task)
  }

  return { overdue, dueToday }
}

export function NotificationsDropdown() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const tasksQuery = useTasks()
  const tasks = tasksQuery.data ?? []
  const { overdue, dueToday } = groupTasks(tasks)
  const badgeCount = overdue.length + dueToday.length

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function goToTasks() {
    navigate('/tasks')
    setOpen(false)
  }

  const allUrgent = [...overdue, ...dueToday]

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${badgeCount > 0 ? ` (${badgeCount} urgent)` : ''}`}
        aria-expanded={open}
        className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <Bell className="h-5 w-5" />
        {badgeCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-lg border border-border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            <button
              type="button"
              onClick={() => { navigate('/notifications'); setOpen(false) }}
              className="text-xs text-brand-600 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto py-2">
            {allUrgent.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-200" />
                <p className="mt-2 text-sm font-medium text-slate-600">
                  All caught up!
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  No tasks due today or overdue.
                </p>
              </div>
            ) : (
              <>
                {overdue.length > 0 ? (
                  <div>
                    <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-500">
                      Overdue ({overdue.length})
                    </p>
                    {overdue.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onClick={goToTasks}
                        urgent
                      />
                    ))}
                  </div>
                ) : null}
                {dueToday.length > 0 ? (
                  <div>
                    <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-yellow-600">
                      Due today ({dueToday.length})
                    </p>
                    {dueToday.map((task) => (
                      <TaskRow key={task.id} task={task} onClick={goToTasks} />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="border-t border-border px-4 py-2">
            <button
              type="button"
              onClick={goToTasks}
              className="w-full rounded-md bg-slate-50 py-2 text-center text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Go to Tasks
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function TaskRow({
  task,
  onClick,
  urgent = false,
}: {
  task: Activity
  onClick: () => void
  urgent?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
    >
      <CheckSquare
        className={[
          'mt-0.5 h-4 w-4 shrink-0',
          urgent ? 'text-red-400' : 'text-yellow-400',
        ].join(' ')}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
          {task.relatedName ? <span className="truncate">{task.relatedName}</span> : null}
          {task.dueDate ? (
            <span className={urgent ? 'font-medium text-red-500' : ''}>
              Due {task.dueDate}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
