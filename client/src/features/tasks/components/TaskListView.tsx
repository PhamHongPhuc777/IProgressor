import { Badge } from '@/components/ui/badge'
import type { TaskView } from '../api/tasks'

const label = (s: string) => s.toLowerCase().replace(/_/g, ' ')

export function TaskListView({
  tasks,
  onSelect,
}: {
  tasks: TaskView[]
  onSelect: (taskId: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Task</th>
            <th className="px-3 py-2 font-medium">Assignee</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Priority</th>
            <th className="px-3 py-2 font-medium">Due date</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.taskId} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => onSelect(t.taskId)}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {t.title}
                </button>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {t.assigneeName ?? 'Unassigned'}
              </td>
              <td className="px-3 py-2">
                <Badge variant="secondary">{label(t.status)}</Badge>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{label(t.priority)}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
