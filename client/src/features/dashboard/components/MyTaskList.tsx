import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import type { MyTask } from '../api/dashboard'

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ')

export function MyTaskList({ tasks }: { tasks: MyTask[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks assigned to you.</p>
  }
  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {tasks.map((t) => (
        <li key={t.taskId}>
          <Link
            to={`/projects/${t.projectId}`}
            className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted/40"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{t.title}</div>
              <div className="truncate text-xs text-muted-foreground">{t.projectName}</div>
            </div>
            {t.dueDate && (
              <span className="text-xs text-muted-foreground">
                due {new Date(t.dueDate).toLocaleDateString()}
              </span>
            )}
            <Badge variant="secondary">{label(t.status)}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  )
}
