import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { ApiError } from '@/lib/api/client'
import { useMe } from '@/features/workspace'
import {
  createMilestone,
  deleteMilestone,
  getMilestones,
  MILESTONE_STATUSES,
  updateMilestone,
} from '../api/milestones'

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ')

function err(e: unknown, fallback: string) {
  toast.error(e instanceof ApiError ? e.message : fallback)
}

export function MilestonesSection({ projectId }: { projectId: string }) {
  const { can } = useMe()
  const queryClient = useQueryClient()
  const canCrud = can('milestone.crud')
  const [name, setName] = useState('')
  const [dueDate, setDueDate] = useState('')

  const milestones = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => getMilestones(projectId),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })

  const create = useMutation({
    mutationFn: () =>
      createMilestone(projectId, {
        name: name.trim(),
        dueDate: dueDate || undefined,
      }),
    onSuccess: () => {
      toast.success('Milestone added.')
      setName('')
      setDueDate('')
      invalidate()
    },
    onError: (e) => err(e, 'Could not add milestone.'),
  })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateMilestone(id, { status }),
    onSuccess: invalidate,
    onError: (e) => err(e, 'Could not update milestone.'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteMilestone(id),
    onSuccess: () => {
      toast.success('Milestone deleted.')
      invalidate()
    },
    onError: (e) => err(e, 'Could not delete milestone.'),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Milestones</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {milestones.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : milestones.isError ? (
          <p className="text-sm text-destructive">Couldn’t load milestones.</p>
        ) : milestones.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones yet.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {milestones.data.map((m) => (
              <li
                key={m.milestoneId}
                className="flex items-center gap-3 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{m.name}</div>
                  {m.dueDate && (
                    <div className="text-xs text-muted-foreground">
                      due {new Date(m.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {canCrud ? (
                  <NativeSelect
                    className="w-36"
                    value={m.status}
                    disabled={setStatus.isPending}
                    onChange={(e) =>
                      setStatus.mutate({ id: m.milestoneId, status: e.target.value })
                    }
                  >
                    {MILESTONE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {label(s)}
                      </option>
                    ))}
                  </NativeSelect>
                ) : (
                  <Badge variant="secondary">{label(m.status)}</Badge>
                )}
                {canCrud && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Delete milestone"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete milestone “${m.name}”?`))
                        remove.mutate(m.milestoneId)
                    }}
                  >
                    <Trash2 />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canCrud && (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (name.trim()) create.mutate()
            }}
          >
            <Input
              className="w-48"
              placeholder="New milestone"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              className="w-40"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={create.isPending || !name.trim()}>
              Add
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
