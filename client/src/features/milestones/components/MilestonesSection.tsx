import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMe } from '@/features/workspace'
import { getMilestones, type Milestone } from '../api/milestones'
import { MilestoneDialog } from './MilestoneDialog'

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ')

export function MilestonesSection({ projectId }: { projectId: string }) {
  const { can } = useMe()
  const canCrud = can('milestone.crud')
  const [selected, setSelected] = useState<Milestone | null>(null)
  const [creating, setCreating] = useState(false)

  const milestones = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => getMilestones(projectId),
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Milestones</CardTitle>
        {canCrud && (
          <Button size="sm" onClick={() => setCreating(true)}>
            Add milestone
          </Button>
        )}
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
              <li key={m.milestoneId}>
                <button
                  type="button"
                  onClick={() => setSelected(m)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{m.name}</div>
                    {m.dueDate && (
                      <div className="text-xs text-muted-foreground">
                        due {new Date(m.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary">{label(m.status)}</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {selected && (
        <MilestoneDialog
          projectId={projectId}
          milestone={selected}
          canEdit={canCrud}
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
        />
      )}
      {creating && (
        <MilestoneDialog
          projectId={projectId}
          canEdit={canCrud}
          open={creating}
          onOpenChange={setCreating}
        />
      )}
    </Card>
  )
}
