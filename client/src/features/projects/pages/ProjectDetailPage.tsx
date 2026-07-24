import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError } from '@/lib/api/client'
import { useMe } from '@/features/workspace'
import { archiveProject, getProject } from '../api/projects'
import { ProjectForm } from '../components/ProjectForm'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'
import { formatDate } from '../utils'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div>{value}</div>
    </div>
  )
}

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = useMe()
  const [editing, setEditing] = useState(false)

  const project = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id),
    enabled: !!id,
  })

  const archive = useMutation({
    mutationFn: () => archiveProject(id),
    onSuccess: () => {
      toast.success('Project archived.')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate('/projects')
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : 'Could not archive project.',
      ),
  })

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/projects"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Projects
      </Link>

      {project.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : project.isError ? (
        <p className="text-sm text-destructive">Couldn’t load this project.</p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{project.data.name}</h1>
              <ProjectStatusBadge status={project.data.status} />
            </div>
            {can('project.crud') && !editing && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  disabled={archive.isPending}
                  onClick={() => {
                    if (window.confirm('Archive this project?')) archive.mutate()
                  }}
                >
                  Archive
                </Button>
              </div>
            )}
          </div>

          {editing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit project</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectForm
                  project={project.data}
                  onDone={() => setEditing(false)}
                  onCancel={() => setEditing(false)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="grid grid-cols-2 gap-4 py-4 text-sm">
                <Field
                  label="Department"
                  value={project.data.departmentName ?? '—'}
                />
                <Field
                  label="Owner"
                  value={project.data.ownerName ?? 'Unassigned'}
                />
                <Field
                  label="Start date"
                  value={formatDate(project.data.startDate)}
                />
                <Field label="End date" value={formatDate(project.data.endDate)} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The task board arrives in the next phase.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
