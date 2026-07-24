import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Kanban, List, CalendarDays, GanttChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ViewToggle } from '@/components/common/ViewToggle'
import { useMe } from '@/features/workspace'
import { useUiStore } from '@/stores/ui-store'
import { getTasks } from '../api/tasks'
import { TaskForm } from './TaskForm'
import { TaskDetail } from './TaskDetail'
import { TaskKanbanView } from './TaskKanbanView'
import { TaskListView } from './TaskListView'
import { TaskCalendarView } from './TaskCalendarView'
import { TaskGanttView } from './TaskGanttView'

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
  const taskView = useUiStore((s) => s.taskView)
  const setTaskView = useUiStore((s) => s.setTaskView)

  const tasks = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => getTasks(projectId),
  })

  // All 4 views render the same top-level tasks -- subtasks live inside their
  // parent's TaskDetail dialog, not as independent rows/cards/bars.
  const topLevel = tasks.data?.filter((t) => !t.parentTaskId) ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Tasks</CardTitle>
        <div className="flex items-center gap-2">
          <ViewToggle
            value={taskView}
            onChange={setTaskView}
            options={[
              { value: 'kanban', label: 'Kanban', icon: Kanban },
              { value: 'list', label: 'List', icon: List },
              { value: 'calendar', label: 'Calendar', icon: CalendarDays },
              { value: 'gantt', label: 'Gantt', icon: GanttChart },
            ]}
          />
          {can('task.crud') && !creating && (
            <Button size="sm" onClick={() => setCreating(true)}>
              New task
            </Button>
          )}
        </div>
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
        ) : taskView === 'list' ? (
          <TaskListView tasks={topLevel} onSelect={setSelectedId} />
        ) : taskView === 'calendar' ? (
          <TaskCalendarView tasks={topLevel} onSelect={setSelectedId} />
        ) : taskView === 'gantt' ? (
          <TaskGanttView tasks={topLevel} onSelect={setSelectedId} />
        ) : (
          <TaskKanbanView tasks={tasks.data} onSelect={setSelectedId} />
        )}

        {selectedId && (
          <TaskDetail
            taskId={selectedId}
            projectId={projectId}
            departmentId={departmentId}
            open
            onOpenChange={(next) => !next && setSelectedId(null)}
            onSelectTask={setSelectedId}
          />
        )}
      </CardContent>
    </Card>
  )
}
