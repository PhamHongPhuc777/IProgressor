import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/features/auth/hooks/useSession'
import { useMe } from '@/features/workspace'
import {
  getEnterpriseDashboard,
  getMyDashboard,
  type DepartmentPerformance,
} from '../api/dashboard'

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

/** completionRate may be a 0–1 fraction or a 0–100 percent; normalize either. */
function pct(rate: number) {
  const p = rate <= 1 ? rate * 100 : rate
  return `${Math.round(p)}%`
}

function PerformanceTable({ rows }: { rows: DepartmentPerformance[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Department</th>
            <th className="px-3 py-2 font-medium">Completion</th>
            <th className="px-3 py-2 font-medium">Overdue</th>
            <th className="px-3 py-2 font-medium">Tasks</th>
            <th className="px-3 py-2 font-medium">Health</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.departmentId} className="border-b last:border-0">
              <td className="px-3 py-2 font-medium">{d.departmentName}</td>
              <td className="px-3 py-2">{pct(d.completionRate)}</td>
              <td className="px-3 py-2 text-muted-foreground">{d.overdueTasks}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {d.completedTasks}/{d.totalTasks}
              </td>
              <td className="px-3 py-2">
                <Badge variant={d.atRisk ? 'destructive' : 'secondary'}>
                  {d.atRisk ? 'at risk' : 'on track'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DashboardPage() {
  const { profile } = useSession()
  const { can, me } = useMe()

  const my = useQuery({ queryKey: ['dashboard', 'me'], queryFn: getMyDashboard })

  const canEnterprise =
    me?.roleName?.toLowerCase() === 'admin' || can('performance_risk.view')
  const enterprise = useQuery({
    queryKey: ['dashboard', 'enterprise'],
    queryFn: getEnterpriseDashboard,
    enabled: canEnterprise,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome{profile?.name ? `, ${profile.name}` : ''}.
        </p>
      </div>

      {my.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : my.isError ? (
        <p className="text-sm text-destructive">Couldn’t load your dashboard.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active projects" value={my.data.activeProjectCount} />
            {my.data.myStats && (
              <>
                <StatCard
                  label="Assigned tasks"
                  value={my.data.myStats.assignedTaskCount}
                />
                <StatCard
                  label="In progress"
                  value={my.data.myStats.inProgressTaskCount}
                />
                <StatCard
                  label="Completed"
                  value={my.data.myStats.completedTaskCount}
                />
                <StatCard
                  label="Overdue"
                  value={my.data.myStats.overdueTaskCount}
                />
              </>
            )}
          </div>

          {my.data.departmentPerformance && (
            <Card>
              <CardHeader>
                <CardTitle>Department performance</CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceTable rows={[my.data.departmentPerformance]} />
              </CardContent>
            </Card>
          )}

          {my.data.workload && my.data.workload.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team workload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Member</th>
                        <th className="px-3 py-2 font-medium">Active tasks</th>
                        <th className="px-3 py-2 font-medium">Overdue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {my.data.workload.map((w) => (
                        <tr key={w.userId} className="border-b last:border-0">
                          <td className="px-3 py-2 font-medium">{w.fullName}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {w.activeTaskCount}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {w.overdueTaskCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {canEnterprise && (
            <Card>
              <CardHeader>
                <CardTitle>Enterprise overview</CardTitle>
              </CardHeader>
              <CardContent>
                {enterprise.isPending ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : enterprise.isError ? (
                  <p className="text-sm text-destructive">
                    Couldn’t load enterprise stats.
                  </p>
                ) : enterprise.data.departments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                ) : (
                  <PerformanceTable rows={enterprise.data.departments} />
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
