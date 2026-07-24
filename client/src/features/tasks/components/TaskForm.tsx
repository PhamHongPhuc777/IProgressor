import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/client'
import { getDepartmentMembers } from '@/features/workspace'
import { getMilestones } from '@/features/milestones'
import {
  createTask,
  TASK_PRIORITIES,
  TASK_STATUSES,
  updateTask,
  type TaskView,
} from '../api/tasks'

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ')

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  milestoneId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.string().min(1),
  priority: z.string().min(1),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function TaskForm({
  projectId,
  departmentId,
  task,
  onDone,
  onCancel,
}: {
  projectId: string
  departmentId: string
  task?: TaskView
  onDone: () => void
  onCancel: () => void
}) {
  const isEdit = !!task
  const queryClient = useQueryClient()

  const milestones = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => getMilestones(projectId),
  })
  const members = useQuery({
    queryKey: ['department-members', departmentId],
    queryFn: () => getDepartmentMembers(departmentId, { size: 100 }),
    enabled: !!departmentId,
    staleTime: 60 * 1000,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      milestoneId: task?.milestoneId ?? '',
      assigneeId: task?.assigneeId ?? '',
      status: task?.status ?? 'NOT_STARTED',
      priority: task?.priority ?? 'MEDIUM',
      startDate: task?.startDate ?? '',
      dueDate: task?.dueDate ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const empty = isEdit ? null : undefined
      const payload = {
        title: values.title,
        description: values.description || empty,
        milestoneId: values.milestoneId || empty,
        assigneeId: values.assigneeId || empty,
        status: values.status,
        priority: values.priority,
        startDate: values.startDate || empty,
        dueDate: values.dueDate || empty,
      }
      return task
        ? updateTask(task.taskId, payload)
        : createTask(projectId, payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Task updated.' : 'Task created.')
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      if (task) queryClient.invalidateQueries({ queryKey: ['task', task.taskId] })
      onDone()
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : 'Could not save task.'),
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
    >
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="assigneeId">Assignee</Label>
          <NativeSelect id="assigneeId" {...register('assigneeId')}>
            <option value="">Unassigned</option>
            {members.data?.content.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.fullName}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="milestoneId">Milestone</Label>
          <NativeSelect id="milestoneId" {...register('milestoneId')}>
            <option value="">None</option>
            {milestones.data?.map((m) => (
              <option key={m.milestoneId} value={m.milestoneId}>
                {m.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <NativeSelect id="status" {...register('status')}>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="priority">Priority</Label>
          <NativeSelect id="priority" {...register('priority')}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {label(p)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...register('startDate')} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="date" {...register('dueDate')} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  )
}
