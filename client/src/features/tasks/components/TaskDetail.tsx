import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  onClose,
}: {
  taskId: string
  projectId: string
  departmentId: string
  onClose: () => void
}) {
  const { can } = useMe()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
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
      onClose()
    },
    onError: onError('delete task'),
  })

  const milestoneName =
    milestones.data?.find((m) => m.milestoneId === task.data?.milestoneId)?.name ??
    '—'

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle>{task.data?.title ?? 'Task'}</CardTitle>
        <Button size="icon-sm" variant="ghost" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
          <>
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
            <TaskComments taskId={taskId} />
            <Separator />
            <TaskAttachments taskId={taskId} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
