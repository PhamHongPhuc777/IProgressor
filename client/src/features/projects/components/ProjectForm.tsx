import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { ApiError } from '@/lib/api/client'
import { getDepartments, getUsers, useMe } from '@/features/workspace'
import {
  createProject,
  PROJECT_STATUSES,
  updateProject,
  type Project,
} from '../api/projects'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  departmentId: z.string().min(1, 'Department is required'),
  ownerId: z.string().optional(),
  status: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function ProjectForm({
  project,
  onDone,
  onCancel,
}: {
  project?: Project
  onDone: () => void
  onCancel: () => void
}) {
  const isEdit = !!project
  const { can } = useMe()
  const queryClient = useQueryClient()

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    enabled: can('workspace.members.view'),
    staleTime: 5 * 60 * 1000,
  })

  // Owner picker needs the member list, which is Leader/Admin-only; hidden for
  // PMs (owner stays as-is / unset), so the form still works for them.
  const canPickOwner = can('enterprise.members.view')
  const users = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => getUsers({ size: 100 }),
    enabled: canPickOwner,
    staleTime: 60 * 1000,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? '',
      departmentId: project?.departmentId ?? '',
      ownerId: project?.ownerId ?? '',
      status: project?.status ?? 'PLANNING',
      startDate: project?.startDate ?? '',
      endDate: project?.endDate ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      // On edit, empty fields clear (null); on create, they're simply omitted.
      const common = {
        name: values.name,
        ownerId: values.ownerId ? values.ownerId : isEdit ? null : undefined,
        status: values.status,
        startDate: values.startDate || (isEdit ? null : undefined),
        endDate: values.endDate || (isEdit ? null : undefined),
      }
      return project
        ? updateProject(project.projectId, common)
        : createProject({ ...common, departmentId: values.departmentId })
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Project updated.' : 'Project created.')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      if (project)
        queryClient.invalidateQueries({ queryKey: ['project', project.projectId] })
      onDone()
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : 'Could not save project.',
      ),
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
    >
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {!isEdit && (
        <div className="grid gap-2">
          <Label htmlFor="departmentId">Department</Label>
          <NativeSelect
            id="departmentId"
            disabled={departments.isPending}
            {...register('departmentId')}
          >
            <option value="" disabled>
              {departments.isPending ? 'Loading…' : 'Select a department'}
            </option>
            {departments.data?.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.name}
              </option>
            ))}
          </NativeSelect>
          {errors.departmentId && (
            <p className="text-xs text-destructive">
              {errors.departmentId.message}
            </p>
          )}
        </div>
      )}

      {canPickOwner && (
        <div className="grid gap-2">
          <Label htmlFor="ownerId">Owner</Label>
          <NativeSelect id="ownerId" {...register('ownerId')}>
            <option value="">Unassigned</option>
            {users.data?.content.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.fullName}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <NativeSelect id="status" {...register('status')}>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase().replace(/_/g, ' ')}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...register('startDate')} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" {...register('endDate')} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? 'Saving…'
            : isEdit
              ? 'Save changes'
              : 'Create project'}
        </Button>
      </div>
    </form>
  )
}
