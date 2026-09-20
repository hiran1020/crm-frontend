import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  Trash2,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ActivityFormModal } from '@/components/activities/ActivityFormModal'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { useToast } from '@/components/common/ToastProvider'
import {
  useCreateActivity,
  useDeleteActivity,
  useMarkActivityComplete,
  useTasks,
} from '@/hooks/useActivities'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatDate } from '@/lib/format'
import type { ActivityFormValues } from '@/schemas/activity'
import type { Activity, ActivityPriority } from '@/types/activity'

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const PRIORITY_STYLES: Record<ActivityPriority, { badge: string; ring: string }> = {
  high:   { badge: 'bg-red-100 text-red-700',    ring: 'ring-red-200' },
  medium: { badge: 'bg-yellow-100 text-yellow-700', ring: 'ring-yellow-200' },
  low:    { badge: 'bg-blue-100 text-blue-700',   ring: 'ring-blue-200' },
}

function relatedHref(task: Activity): string | null {
  if (!task.relatedTo) return null
  if (task.relatedType === 'customer') return `/customers/${task.relatedTo}`
  if (task.relatedType === 'lead')     return `/leads/${task.relatedTo}`
  if (task.relatedType === 'deal')     return `/deals/${task.relatedTo}`
  return null
}

function daysUntil(date: string): number {
  return Math.floor((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

/* ── Expandable TaskItem ─────────────────────────────────────────────────── */

function TaskItem({
  task,
  onComplete,
  onDelete,
  busy,
}: {
  task: Activity
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  busy: boolean
}) {
  const [open, setOpen] = useState(false)

  const priority = task.priority
  const pStyle = priority ? PRIORITY_STYLES[priority] : null
  const href = relatedHref(task)
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = task.dueDate && task.dueDate < today && !task.completed
  const isDueToday = task.dueDate === today && !task.completed

  return (
    <div
      className={[
        'rounded-lg border bg-white shadow-sm transition-shadow',
        open ? 'border-brand-300 shadow-md' : 'border-border',
        task.completed ? 'opacity-60' : '',
      ].join(' ')}
    >
      {/* Collapsed row — click to expand */}
      <div
        className="flex cursor-pointer items-start gap-3 p-3 select-none"
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
      >
        {/* Checkbox — click stops propagation so it doesn't toggle accordion */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (!task.completed) onComplete(task.id)
          }}
          disabled={task.completed || busy}
          aria-label={task.completed ? 'Task completed' : `Mark "${task.title}" complete`}
          className={[
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
            task.completed
              ? 'border-emerald-500 bg-emerald-500'
              : 'border-slate-300 hover:border-brand-500',
          ].join(' ')}
        >
          {task.completed ? <Check className="h-3 w-3 text-white" aria-hidden /> : null}
        </button>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <p
            className={[
              'text-sm font-medium leading-snug',
              task.completed ? 'text-slate-400 line-through' : 'text-slate-900',
            ].join(' ')}
          >
            {task.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            {task.relatedName ? (
              <span className="truncate max-w-[140px]">{task.relatedName}</span>
            ) : null}
            {task.dueDate ? (
              <>
                {task.relatedName ? <span>·</span> : null}
                <span
                  className={[
                    isOverdue ? 'font-semibold text-red-600' : isDueToday ? 'font-semibold text-orange-600' : '',
                  ].join(' ')}
                >
                  {isOverdue
                    ? `${Math.abs(daysUntil(task.dueDate))}d overdue`
                    : isDueToday
                    ? 'Due today'
                    : `Due ${task.dueDate}`}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Right side: priority + chevron */}
        <div className="flex shrink-0 items-center gap-2">
          {pStyle && priority ? (
            <span className={['rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', pStyle.badge].join(' ')}>
              {priority}
            </span>
          ) : null}
          <span className="text-slate-400">
            {open
              ? <ChevronDown className="h-4 w-4" />
              : <ChevronRight className="h-4 w-4" />}
          </span>
        </div>
      </div>

      {/* Expanded detail panel */}
      {open ? (
        <div className="accordion-open border-t border-border bg-slate-50 px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Left column: details */}
            <div className="space-y-3">
              {task.description ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{task.description}</p>
                </div>
              ) : null}

              <div className="space-y-1.5">
                {task.owner ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                    <span className="text-slate-400 w-14 text-xs">Owner</span>
                    {task.owner}
                  </div>
                ) : null}
                {task.dueDate ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                    <span className="text-slate-400 w-14 text-xs">Due</span>
                    <span className={isOverdue ? 'text-red-600 font-medium' : isDueToday ? 'text-orange-600 font-medium' : ''}>
                      {formatDate(task.dueDate)}
                      {isOverdue ? ` (${Math.abs(daysUntil(task.dueDate))} days overdue)` : isDueToday ? ' (today)' : ''}
                    </span>
                  </div>
                ) : null}
                {href ? (
                  <div className="flex items-center gap-2 text-sm">
                    <LinkIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                    <span className="text-slate-400 w-14 text-xs capitalize">{task.relatedType}</span>
                    <Link
                      to={href}
                      className="text-brand-600 hover:underline truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.relatedName}
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right column: actions */}
            <div className="flex flex-col gap-2 sm:items-end">
              {!task.completed ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={(e) => { e.stopPropagation(); onComplete(task.id) }}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                  <Check className="h-4 w-4" aria-hidden />
                  Mark Complete
                </button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}

              {href ? (
                <Link
                  to={href}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 w-full sm:w-auto justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Open {task.relatedType}
                </Link>
              ) : null}

              <button
                type="button"
                disabled={busy}
                onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
                className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete Task
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ── Task Group ──────────────────────────────────────────────────────────── */

interface TaskGroupProps {
  label: string
  labelColor?: string
  tasks: Activity[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  busy: boolean
  defaultOpen?: boolean
}

function TaskGroup({
  label,
  labelColor = 'text-slate-500',
  tasks,
  onComplete,
  onDelete,
  busy,
  defaultOpen = true,
}: TaskGroupProps) {
  const [groupOpen, setGroupOpen] = useState(defaultOpen)

  if (tasks.length === 0) return null

  return (
    <div>
      {/* Group header — click to collapse/expand the whole group */}
      <button
        type="button"
        onClick={() => setGroupOpen((v) => !v)}
        className="mb-3 flex w-full items-center gap-2 text-left"
      >
        <span className={['text-xs font-semibold uppercase tracking-wide', labelColor].join(' ')}>
          {label}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {tasks.length}
        </span>
        <span className="ml-auto text-slate-400">
          {groupOpen
            ? <ChevronDown className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
      </button>

      {groupOpen ? (
        <div className="space-y-2 accordion-open">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDelete={onDelete}
              busy={busy}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* ── Group tasks ─────────────────────────────────────────────────────────── */

function groupTasks(tasks: Activity[]) {
  const today = new Date().toISOString().slice(0, 10)
  const overdue: Activity[] = []
  const dueToday: Activity[] = []
  const upcoming: Activity[] = []
  const completed: Activity[] = []

  for (const task of tasks) {
    if (task.completed) { completed.push(task); continue }
    if (!task.dueDate)  { upcoming.push(task);  continue }
    if (task.dueDate < today) overdue.push(task)
    else if (task.dueDate === today) dueToday.push(task)
    else upcoming.push(task)
  }

  return { overdue, dueToday, upcoming, completed }
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export function TasksPage() {
  usePageTitle('Tasks')
  const { notify } = useToast()
  const tasksQuery      = useTasks()
  const markComplete    = useMarkActivityComplete()
  const deleteActivity  = useDeleteActivity()
  const createActivity  = useCreateActivity()
  const [addTaskOpen, setAddTaskOpen] = useState(false)

  async function handleComplete(id: string) {
    try {
      await markComplete.mutateAsync(id)
      notify('Task marked complete')
    } catch { notify('Could not update task', 'error') }
  }

  async function handleDelete(id: string) {
    try {
      await deleteActivity.mutateAsync(id)
      notify('Task deleted')
    } catch { notify('Could not delete task', 'error') }
  }

  async function handleAddTask(values: ActivityFormValues) {
    try {
      await createActivity.mutateAsync({
        type: 'task',
        title: values.title,
        description: values.description,
        owner: values.owner,
        completed: values.completed,
        dueDate: values.dueDate,
        priority: values.priority,
      })
      notify('Task created')
      setAddTaskOpen(false)
    } catch { notify('Could not create task', 'error') }
  }

  if (tasksQuery.isError) {
    return (
      <ErrorState
        title="Could not load tasks"
        message={tasksQuery.error instanceof Error ? tasksQuery.error.message : 'Unknown error'}
        onRetry={() => void tasksQuery.refetch()}
      />
    )
  }

  const tasks = tasksQuery.data ?? []
  const { overdue, dueToday, upcoming, completed } = groupTasks(tasks)
  const busy = markComplete.isPending || deleteActivity.isPending

  const isEmpty = overdue.length + dueToday.length + upcoming.length + completed.length === 0

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Tasks</h2>
          <p className="mt-1 text-sm text-slate-500">
            Click any task to expand details, mark complete, or open the linked record.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddTaskOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add Task
        </button>
      </div>

      {tasksQuery.isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg border border-border bg-slate-100" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          title="No tasks"
          description="All caught up! Tasks linked to deals, leads, and customers will appear here."
          actionLabel="Add Task"
          onAction={() => setAddTaskOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          <TaskGroup
            label="Overdue"
            labelColor="text-red-600"
            tasks={overdue}
            onComplete={(id) => void handleComplete(id)}
            onDelete={(id) => void handleDelete(id)}
            busy={busy}
          />
          <TaskGroup
            label="Due today"
            labelColor="text-orange-600"
            tasks={dueToday}
            onComplete={(id) => void handleComplete(id)}
            onDelete={(id) => void handleDelete(id)}
            busy={busy}
          />
          <TaskGroup
            label="Upcoming"
            tasks={upcoming}
            onComplete={(id) => void handleComplete(id)}
            onDelete={(id) => void handleDelete(id)}
            busy={busy}
          />
          <TaskGroup
            label="Completed"
            labelColor="text-slate-400"
            tasks={completed}
            onComplete={(id) => void handleComplete(id)}
            onDelete={(id) => void handleDelete(id)}
            busy={busy}
            defaultOpen={false}
          />
        </div>
      )}

      <ActivityFormModal
        open={addTaskOpen}
        defaultType="task"
        busy={createActivity.isPending}
        onClose={() => setAddTaskOpen(false)}
        onSubmit={handleAddTask}
      />
    </div>
  )
}
