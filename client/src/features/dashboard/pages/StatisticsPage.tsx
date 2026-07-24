import { useQuery } from '@tanstack/react-query'
import { getMyDashboard } from '../api/dashboard'
import { StatCard } from '../components/StatCard'

/** Staff-only: their own performance numbers (stats.view.own via /dashboard/me). */
export function StatisticsPage() {
  const my = useQuery({ queryKey: ['dashboard', 'me'], queryFn: getMyDashboard })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <p className="text-sm text-muted-foreground">Your overall performance.</p>
      </div>

      {my.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : my.isError ? (
        <p className="text-sm text-destructive">Couldn’t load your statistics.</p>
      ) : !my.data.myStats ? (
        <p className="text-sm text-muted-foreground">No statistics available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Assigned tasks" value={my.data.myStats.assignedTaskCount} />
          <StatCard label="In progress" value={my.data.myStats.inProgressTaskCount} />
          <StatCard label="In review" value={my.data.myStats.inReviewTaskCount} />
          <StatCard label="Overdue" value={my.data.myStats.overdueTaskCount} />
          <StatCard label="Completed" value={my.data.myStats.completedTaskCount} />
          <StatCard label="Active projects" value={my.data.activeProjectCount} />
        </div>
      )}
    </div>
  )
}
