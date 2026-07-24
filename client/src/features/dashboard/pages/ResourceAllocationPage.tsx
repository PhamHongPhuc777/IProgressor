import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { useMe } from '@/features/workspace'
import { getResourceAllocation } from '../api/dashboard'

/** PM-only: resource_allocation.view, always scoped to the PM's own department. */
export function ResourceAllocationPage() {
  const { user } = useMe()

  const workload = useQuery({
    queryKey: ['resource-allocation', user?.departmentId],
    queryFn: () => getResourceAllocation(user!.departmentId),
    enabled: !!user?.departmentId,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Resource Allocation</h1>
        <p className="text-sm text-muted-foreground">
          Workload across your department, by member.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {workload.isPending ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : workload.isError ? (
            <p className="p-4 text-sm text-destructive">Couldn’t load workload data.</p>
          ) : workload.data.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No members with tasks yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Member</th>
                  <th className="px-3 py-2 font-medium">Active tasks</th>
                  <th className="px-3 py-2 font-medium">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {workload.data.map((w) => (
                  <tr key={w.userId} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{w.fullName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{w.activeTaskCount}</td>
                    <td className="px-3 py-2 text-muted-foreground">{w.overdueTaskCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
