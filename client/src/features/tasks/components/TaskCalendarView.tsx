import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TaskView } from '../api/tasks'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function TaskCalendarView({
  tasks,
  onSelect,
}: {
  tasks: TaskView[]
  onSelect: (taskId: string) => void
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const byDate = new Map<string, TaskView[]>()
  for (const t of tasks) {
    if (!t.dueDate) continue
    const list = byDate.get(t.dueDate) ?? []
    list.push(t)
    byDate.set(t.dueDate, list)
  }

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = toDateKey(new Date())

  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Previous month"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
        >
          <ChevronLeft />
        </Button>
        <span className="text-sm font-medium">
          {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Next month"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
        >
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          const key = date ? toDateKey(date) : `empty-${i}`
          const dayTasks = date ? (byDate.get(toDateKey(date)) ?? []) : []
          return (
            <div
              key={key}
              className={cn(
                'flex min-h-24 flex-col gap-1 border-b border-r p-1.5 last:border-r-0',
                (i + 1) % 7 === 0 && 'border-r-0',
              )}
            >
              {date && (
                <span
                  className={cn(
                    'self-start rounded-full px-1.5 text-xs',
                    toDateKey(date) === todayKey
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {date.getDate()}
                </span>
              )}
              {dayTasks.slice(0, 3).map((t) => (
                <button
                  key={t.taskId}
                  type="button"
                  onClick={() => onSelect(t.taskId)}
                  className="truncate rounded bg-muted px-1 py-0.5 text-left text-xs hover:bg-muted-foreground/20"
                  title={t.title}
                >
                  {t.title}
                </button>
              ))}
              {dayTasks.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{dayTasks.length - 3} more
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
