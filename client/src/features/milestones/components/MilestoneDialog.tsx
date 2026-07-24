import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { ApiError } from '@/lib/api/client'
import {
  createMilestone,
  deleteMilestone,
  MILESTONE_STATUSES,
  updateMilestone,
  type Milestone,
} from '../api/milestones'

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ')

function err(e: unknown, fallback: string) {
  toast.error(e instanceof ApiError ? e.message : fallback)
}

/** Create (no `milestone`) or view/edit (`milestone` set) — one dialog for both, per UI.md. */
export function MilestoneDialog({
  projectId,
  milestone,
  canEdit,
  open,
  onOpenChange,
}: {
  projectId: string
  milestone?: Milestone
  canEdit: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isCreate = !milestone
  const queryClient = useQueryClient()
  const [name, setName] = useState(milestone?.name ?? '')
  const [dueDate, setDueDate] = useState(milestone?.dueDate ?? '')
  const [status, setStatus] = useState(milestone?.status ?? 'NOT_STARTED')

  useEffect(() => {
    setName(milestone?.name ?? '')
    setDueDate(milestone?.dueDate ?? '')
    setStatus(milestone?.status ?? 'NOT_STARTED')
  }, [milestone])

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })

  const save = useMutation({
    mutationFn: () =>
      milestone
        ? updateMilestone(milestone.milestoneId, { name, dueDate: dueDate || null, status })
        : createMilestone(projectId, { name, dueDate: dueDate || undefined, status }),
    onSuccess: () => {
      toast.success(isCreate ? 'Milestone added.' : 'Milestone updated.')
      invalidate()
      onOpenChange(false)
    },
    onError: (e) => err(e, 'Could not save milestone.'),
  })

  const remove = useMutation({
    mutationFn: () => deleteMilestone(milestone!.milestoneId),
    onSuccess: () => {
      toast.success('Milestone deleted.')
      invalidate()
      onOpenChange(false)
    },
    onError: (e) => err(e, 'Could not delete milestone.'),
  })

  const readOnly = !canEdit

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? 'New milestone' : milestone.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="milestone-name">Name</Label>
            <Input
              id="milestone-name"
              value={name}
              disabled={readOnly}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="milestone-due">Due date</Label>
              <Input
                id="milestone-due"
                type="date"
                value={dueDate ?? ''}
                disabled={readOnly}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="milestone-status">Status</Label>
              <NativeSelect
                id="milestone-status"
                value={status}
                disabled={readOnly}
                onChange={(e) => setStatus(e.target.value)}
              >
                {MILESTONE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </div>

        <DialogFooter>
          {canEdit && !isCreate && (
            <Button
              variant="outline"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Delete milestone “${milestone.name}”?`)) remove.mutate()
              }}
            >
              Delete
            </Button>
          )}
          {canEdit && (
            <Button
              className="ml-auto"
              disabled={save.isPending || !name.trim()}
              onClick={() => save.mutate()}
            >
              {save.isPending ? 'Saving…' : isCreate ? 'Add milestone' : 'Save changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
