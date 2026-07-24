import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NativeSelect } from '@/components/ui/native-select'
import { getDepartments, useMe } from '@/features/workspace'
import { getProjects, PROJECT_STATUSES } from '../api/projects'
import { ProjectForm } from '../components/ProjectForm'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'
import { formatDateRange } from '../utils'

export function ProjectsPage() {
  const { can } = useMe()
  const [departmentId, setDepartmentId] = useState('')
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    enabled: can('workspace.members.view'),
    staleTime: 5 * 60 * 1000,
  })

  const projects = useQuery({
    queryKey: ['projects', departmentId || 'all', status || 'all'],
    queryFn: () =>
      getProjects({
        departmentId: departmentId || undefined,
        status: status || undefined,
        size: 100,
      }),
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Plan and track work across departments.
          </p>
        </div>
        {can('project.crud') && !creating && (
          <Button onClick={() => setCreating(true)}>New project</Button>
        )}
      </div>

      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>New project</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm
              onDone={() => setCreating(false)}
              onCancel={() => setCreating(false)}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          className="w-56"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          disabled={departments.isPending}
        >
          <option value="">All departments</option>
          {departments.data?.map((d) => (
            <option key={d.departmentId} value={d.departmentId}>
              {d.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          className="w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase().replace(/_/g, ' ')}
            </option>
          ))}
        </NativeSelect>
        {projects.data && (
          <span className="ml-auto text-sm text-muted-foreground">
            {projects.data.totalElements} project
            {projects.data.totalElements === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {projects.isPending ? (
        <p className="text-sm text-muted-foreground">Loading projects…</p>
      ) : projects.isError ? (
        <p className="text-sm text-destructive">
          Couldn’t load projects.{' '}
          <button
            type="button"
            onClick={() => projects.refetch()}
            className="underline"
          >
            Retry
          </button>
        </p>
      ) : projects.data.content.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Project</th>
                <th className="px-3 py-2 font-medium">Department</th>
                <th className="px-3 py-2 font-medium">Owner</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {projects.data.content.map((p) => (
                <tr
                  key={p.projectId}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-2">
                    <Link
                      to={`/projects/${p.projectId}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.departmentName ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.ownerName ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <ProjectStatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatDateRange(p.startDate, p.endDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
