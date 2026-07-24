import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMe } from '@/features/workspace'
import { getTasks, TASK_STATUSES, type TaskView } from '../api/tasks'
import { TaskForm } from './TaskForm'
import { TaskDetail } from './TaskDetail'

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ')

const PRIORITY_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'secondary',
  URGENT: 'destructive',
}

function TaskCard({
  task,
  onClick,
}: {
  task: TaskView
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

export function TaskBoard({
  projectId,
  departmentId,
}: {
  projectId: string
  departmentId: string
}) {
  const { can } = useMe()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const tasks = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => getTasks(projectId),
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Tasks</CardTitle>
        {can('task.crud') && !creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            New task
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {creating && (
          <div className="rounded-lg border p-4">
            <TaskForm
              projectId={projectId}
              departmentId={departmentId}
              onDone={() => setCreating(false)}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        {tasks.isPending ? (
          <p className="text-sm text-muted-foreground">Loading tasks…</p>
        ) : tasks.isError ? (
          <p className="text-sm text-destructive">
            Couldn’t load tasks.{' '}
            <button
              type="button"
              onClick={() => tasks.refetch()}
              className="underline"
            >
              Retry
            </button>
          </p>
        ) : tasks.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TASK_STATUSES.map((s) => {
              const column = tasks.data.filter(
                (t) => t.status.toUpperCase() === s,
              )
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
                        onClick={() => setSelectedId(t.taskId)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {selectedId && (
          <TaskDetail
            taskId={selectedId}
            projectId={projectId}
            departmentId={departmentId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </CardContent>
    </Card>
  )
}
