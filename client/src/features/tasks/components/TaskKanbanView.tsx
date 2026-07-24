import { Badge } from '@/components/ui/badge'
import { TASK_STATUSES, type TaskView } from '../api/tasks'

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ')

const PRIORITY_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'secondary',
  URGENT: 'destructive',
}

function TaskCard({
  task,
  subtaskCount,
  onClick,
}: {
  task: TaskView
  subtaskCount: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/40"
    >
      <span className="text-sm font-medium">{task.title}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={PRIORITY_VARIANT[task.priority.toUpperCase()] ?? 'outline'}>
          {label(task.priority)}
        </Badge>
        {subtaskCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {subtaskCount} subtask{subtaskCount === 1 ? '' : 's'}
          </span>
        )}
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">
            due {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {task.assigneeName ?? 'Unassigned'}
      </span>
    </button>
  )
}

/** `tasks` is the full project task list (including subtasks); only top-level
 *  tasks get their own column card -- subtasks live in their parent's dialog. */
export function TaskKanbanView({
  tasks,
  onSelect,
}: {
  tasks: TaskView[]
  onSelect: (taskId: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {TASK_STATUSES.map((s) => {
        const column = tasks.filter((t) => t.status.toUpperCase() === s && !t.parentTaskId)
        return (
          <div key={s} className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
              <span>{label(s)}</span>
              <span>{column.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {column.map((t) => (
                <TaskCard
                  key={t.taskId}
                  task={t}
                  subtaskCount={tasks.filter((c) => c.parentTaskId === t.taskId).length}
                  onClick={() => onSelect(t.taskId)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
