import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/features/auth/hooks/useSession'
import { getDepartments, getUsers, useMe } from '@/features/workspace'
import { listAccessRequests } from '@/features/workspace/api/access-requests'
import { getProjects, type Project } from '@/features/projects'
import { getEnterpriseDashboard, getMyDashboard, getMyTasks } from '../api/dashboard'
import { StatCard } from '../components/StatCard'
import { MyTaskList } from '../components/MyTaskList'
import { DepartmentPerformanceTable } from '../components/DepartmentPerformanceTable'

const isOverdue = (p: Project) =>
  !!p.endDate &&
  new Date(p.endDate) < new Date() &&
  !['COMPLETED', 'ARCHIVED'].includes(p.status.toUpperCase())

function ProjectListCard({ title, projects }: { title: string; projects: Project[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {projects.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No projects yet.</p>
        ) : (
          <ul className="divide-y">
            {projects.map((p) => (
              <li key={p.projectId}>
                <Link
                  to={`/projects/${p.projectId}`}
                  className="flex items-center justify-between gap-2 px-4 py-2 text-sm transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0 truncate font-medium">{p.name}</span>
                  <Badge variant="secondary">{p.status.toLowerCase()}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function StaffDashboard() {
  const stats = useQuery({ queryKey: ['dashboard', 'me'], queryFn: getMyDashboard })
  const myTasks = useQuery({ queryKey: ['me', 'tasks'], queryFn: getMyTasks })

  if (stats.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (stats.isError)
    return <p className="text-sm text-destructive">Couldn’t load your dashboard.</p>

  return (
    <>
      {stats.data.myStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total assigned" value={stats.data.myStats.assignedTaskCount} />
          <StatCard label="In progress" value={stats.data.myStats.inProgressTaskCount} />
          <StatCard label="In review" value={stats.data.myStats.inReviewTaskCount} />
          <StatCard label="Overdue" value={stats.data.myStats.overdueTaskCount} />
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Your tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {myTasks.isPending ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : myTasks.isError ? (
            <p className="text-sm text-destructive">Couldn’t load your tasks.</p>
          ) : (
            <MyTaskList tasks={myTasks.data} />
          )}
        </CardContent>
      </Card>
    </>
  )
}

function PmDashboard() {
  const { user } = useMe()
  const projects = useQuery({
    queryKey: ['projects', 'own-department'],
    queryFn: () => getProjects({ departmentId: user!.departmentId, size: 200 }),
    enabled: !!user?.departmentId,
  })

  if (projects.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (projects.isError)
    return <p className="text-sm text-destructive">Couldn’t load your projects.</p>

  const list = projects.data.content
  const planning = list.filter((p) => p.status.toUpperCase() === 'PLANNING')
  const active = list.filter((p) => p.status.toUpperCase() === 'ACTIVE')
  const overdue = list.filter(isOverdue)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total projects" value={list.length} />
        <StatCard label="Planning" value={planning.length} />
        <StatCard label="Active" value={active.length} />
        <StatCard label="Overdue" value={overdue.length} />
      </div>
      <ProjectListCard title="Your department's projects" projects={list} />
    </>
  )
}

function LeaderDashboard() {
  const { user } = useMe()
  const own = useQuery({
    queryKey: ['dashboard', 'me'],
    queryFn: getMyDashboard,
  })
  const enterprise = useQuery({
    queryKey: ['dashboard', 'enterprise'],
    queryFn: getEnterpriseDashboard,
  })

  return (
    <>
      {own.data?.departmentPerformance && (
        <Card>
          <CardHeader>
            <CardTitle>Your department</CardTitle>
          </CardHeader>
          <CardContent>
            <DepartmentPerformanceTable rows={[own.data.departmentPerformance]} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>All departments</CardTitle>
        </CardHeader>
        <CardContent>
          {enterprise.isPending ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : enterprise.isError ? (
            <p className="text-sm text-destructive">Couldn’t load department stats.</p>
          ) : (
            <DepartmentPerformanceTable
              rows={enterprise.data.departments.filter(
                (d) => d.departmentId !== user?.departmentId,
              )}
            />
          )}
        </CardContent>
      </Card>
    </>
  )
}

function AdminDashboard() {
  const departments = useQuery({ queryKey: ['departments'], queryFn: getDepartments })
  const users = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => getUsers({ size: 500 }),
  })
  const pending = useQuery({
    queryKey: ['access-requests', 'PENDING'],
    queryFn: () => listAccessRequests({ status: 'PENDING', size: 500 }),
  })
  const enterprise = useQuery({ queryKey: ['dashboard', 'enterprise'], queryFn: getEnterpriseDashboard })

  const allUsers = users.data?.content ?? []
  const onlineCount = allUsers.filter((u) => u.netbirdConnected).length
  const pendingNew = pending.data?.content.filter((r) => !r.existingUserId).length ?? 0
  const pendingUnlock = pending.data?.content.filter((r) => !!r.existingUserId).length ?? 0

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total members" value={allUsers.length} />
        <StatCard label="Online" value={onlineCount} />
        <StatCard label="Offline" value={allUsers.length - onlineCount} />
        <StatCard
          label="Pending requests"
          value={pending.isPending ? '…' : pendingNew + pendingUnlock}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members &amp; projects by department</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {departments.isPending || enterprise.isPending ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Department</th>
                  <th className="px-3 py-2 font-medium">Members</th>
                  <th className="px-3 py-2 font-medium">Projects</th>
                </tr>
              </thead>
              <tbody>
                {departments.data?.map((d) => {
                  const perf = enterprise.data?.departments.find(
                    (e) => e.departmentId === d.departmentId,
                  )
                  const memberCount = allUsers.filter(
                    (u) => u.departmentId === d.departmentId,
                  ).length
                  return (
                    <tr key={d.departmentId} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{d.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{memberCount}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {perf?.totalProjects ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export function DashboardPage() {
  const { profile } = useSession()
  const { me, isRole } = useMe()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome{profile?.name ? `, ${profile.name}` : ''}.
        </p>
      </div>

      {!me ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : isRole('staff') ? (
        <StaffDashboard />
      ) : isRole('pm') ? (
        <PmDashboard />
      ) : isRole('leader') ? (
        <LeaderDashboard />
      ) : (
        <AdminDashboard />
      )}
    </div>
  )
}
