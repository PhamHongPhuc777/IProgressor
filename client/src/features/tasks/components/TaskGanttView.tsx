import { Badge } from '@/components/ui/badge'
import type { TaskView } from '../api/tasks'

const MS_PER_DAY = 24 * 60 * 60 * 1000

const PRIORITY_BAR: Record<string, string> = {
  LOW: 'bg-muted-foreground/60',
  MEDIUM: 'bg-primary/70',
  HIGH: 'bg-primary',
  URGENT: 'bg-destructive',
}

export function TaskGanttView({
  tasks,
  onSelect,
}: {
  tasks: TaskView[]
  onSelect: (taskId: string) => void
}) {
  const scheduled = tasks.filter((t) => t.startDate || t.dueDate)

  if (scheduled.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tasks have a start or due date to plot.
      </p>
    )
  }

  const starts = scheduled.map((t) => new Date(t.startDate ?? t.dueDate!).getTime())
  const ends = scheduled.map((t) => new Date(t.dueDate ?? t.startDate!).getTime())
  const rangeStart = Math.min(...starts)
  const rangeEnd = Math.max(...ends, rangeStart + MS_PER_DAY)
  const totalSpan = rangeEnd - rangeStart

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{new Date(rangeStart).toLocaleDateString()}</span>
        <span>{new Date(rangeEnd).toLocaleDateString()}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {scheduled.map((t) => {
          const start = new Date(t.startDate ?? t.dueDate!).getTime()
          const end = new Date(t.dueDate ?? t.startDate!).getTime()
          const left = ((start - rangeStart) / totalSpan) * 100
          const width = Math.max(((end - start) / totalSpan) * 100, 1.5)
          return (
            <button
              key={t.taskId}
              type="button"
              onClick={() => onSelect(t.taskId)}
              className="grid grid-cols-[9rem_1fr] items-center gap-2 rounded p-1 text-left hover:bg-muted/40"
            >
              <span className="truncate text-sm">{t.title}</span>
              <span className="relative h-4 rounded bg-muted">
                <span
                  className={`absolute inset-y-0 rounded ${PRIORITY_BAR[t.priority.toUpperCase()] ?? 'bg-primary/70'}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
          <span key={p} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className={`size-2 rounded-full ${PRIORITY_BAR[p]}`} />
            {p.toLowerCase()}
          </span>
        ))}
      </div>
      {tasks.length !== scheduled.length && (
        <Badge variant="outline" className="w-fit">
          {tasks.length - scheduled.length} task
          {tasks.length - scheduled.length === 1 ? '' : 's'} without dates hidden
        </Badge>
      )}
    </div>
  )
}
