import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'
import { ApiError } from '@/lib/api/client'
import { useMe } from '@/features/workspace'
import { getMilestones } from '@/features/milestones'
import {
  addTaskTag,
  deleteTask,
  getTask,
  getTasks,
  TASK_STATUSES,
  updateTaskStatus,
} from '../api/tasks'
import { TaskForm } from './TaskForm'
import { TaskComments } from './TaskComments'
import { TaskAttachments } from './TaskAttachments'

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ')

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  )
}

export function TaskDetail({
  taskId,
  projectId,
  departmentId,
  open,
  onOpenChange,
  onSelectTask,
}: {
  taskId: string
  projectId: string
  departmentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Swaps this same dialog to show a different task — used by the subtask list. */
  onSelectTask: (taskId: string) => void
}) {
  const { can } = useMe()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [tag, setTag] = useState('')

  const canCrud = can('task.crud')
  const canStatus = can('task.status.update')

  const task = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId),
  })
  const milestones = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => getMilestones(projectId),
    enabled: !!task.data?.milestoneId,
  })
  // Same queryKey TaskBoard uses -- reads from cache instantly when the board already fetched it.
  const allTasks = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => getTasks(projectId),
  })
  const subtasks = allTasks.data?.filter((t) => t.parentTaskId === taskId) ?? []

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
  }
  const onError = (verb: string) => (e: unknown) =>
    toast.error(e instanceof ApiError ? e.message : `Could not ${verb}.`)

  const status = useMutation({
    mutationFn: (next: string) => updateTaskStatus(taskId, next),
    onSuccess: invalidate,
    onError: onError('update status'),
  })
  const subtaskStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) => updateTaskStatus(id, next),
    onSuccess: invalidate,
    onError: onError('update subtask'),
  })
  const tagMutation = useMutation({
    mutationFn: (name: string) => addTaskTag(taskId, name),
    onSuccess: () => {
      setTag('')
      invalidate()
    },
    onError: onError('add tag'),
  })
  const remove = useMutation({
    mutationFn: () => deleteTask(taskId),
    onSuccess: () => {
      toast.success('Task deleted.')
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      onOpenChange(false)
    },
    onError: onError('delete task'),
  })
  const removeSubtask = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      toast.success('Subtask deleted.')
      invalidate()
    },
    onError: onError('delete subtask'),
  })

  const milestoneName =
    milestones.data?.find((m) => m.milestoneId === task.data?.milestoneId)?.name ??
    '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.data?.title ?? 'Task'}</DialogTitle>
        </DialogHeader>

        {task.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : task.isError ? (
          <p className="text-sm text-destructive">Couldn’t load this task.</p>
        ) : editing ? (
          <TaskForm
            projectId={projectId}
            departmentId={departmentId}
            task={task.data}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {canStatus ? (
                <NativeSelect
                  className="w-40"
                  value={task.data.status}
                  disabled={status.isPending}
                  onChange={(e) => status.mutate(e.target.value)}
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </NativeSelect>
              ) : (
                <Badge variant="secondary">{label(task.data.status)}</Badge>
              )}
              <Badge variant="outline">{label(task.data.priority)}</Badge>
              {canCrud && (
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm('Delete this task?')) remove.mutate()
                    }}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {task.data.description && (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {task.data.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Assignee" value={task.data.assigneeName ?? 'Unassigned'} />
              <Field label="Milestone" value={milestoneName} />
              <Field label="Start date" value={task.data.startDate ?? '—'} />
              <Field label="Due date" value={task.data.dueDate ?? '—'} />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {task.data.tags.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No tags</span>
                ) : (
                  task.data.tags.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))
                )}
              </div>
              {canCrud && (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (tag.trim()) tagMutation.mutate(tag.trim())
                  }}
                >
                  <Input
                    className="w-40"
                    placeholder="Add tag"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    disabled={tagMutation.isPending || !tag.trim()}
                  >
                    Add
                  </Button>
                </form>
              )}
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Subtasks</h3>
                {canCrud && !addingSubtask && (
                  <Button size="sm" variant="outline" onClick={() => setAddingSubtask(true)}>
                    <Plus /> Add subtask
                  </Button>
                )}
              </div>

              {addingSubtask && (
                <div className="rounded-lg border p-3">
                  <TaskForm
                    projectId={projectId}
                    departmentId={departmentId}
                    parentTaskId={taskId}
                    onDone={() => {
                      setAddingSubtask(false)
                      invalidate()
                    }}
                    onCancel={() => setAddingSubtask(false)}
                  />
                </div>
              )}

              {subtasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subtasks.</p>
              ) : (
                <ul className="flex flex-col divide-y rounded-lg border">
                  {subtasks.map((s) => {
                    const completed = s.status.toUpperCase() === 'COMPLETED'
                    return (
                      <li key={s.taskId} className="flex items-center gap-2 px-3 py-2">
                        {!canCrud && canStatus && (
                          <input
                            type="checkbox"
                            className="size-4 shrink-0 accent-primary"
                            checked={completed}
                            disabled={subtaskStatus.isPending}
                            onChange={(e) =>
                              subtaskStatus.mutate({
                                id: s.taskId,
                                next: e.target.checked ? 'COMPLETED' : 'NOT_STARTED',
                              })
                            }
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectTask(s.taskId)}
                          className={`min-w-0 flex-1 truncate text-left text-sm hover:underline ${completed ? 'text-muted-foreground line-through' : ''}`}
                        >
                          {s.title}
                        </button>
                        <Badge variant="outline">{label(s.status)}</Badge>
                        {canCrud && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Delete subtask"
                            disabled={removeSubtask.isPending}
                            onClick={() => {
                              if (window.confirm(`Delete subtask “${s.title}”?`))
                                removeSubtask.mutate(s.taskId)
                            }}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <Separator />
            <TaskComments taskId={taskId} />
            <Separator />
            <TaskAttachments taskId={taskId} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
