import { Badge } from '@/components/ui/badge'
import type { DepartmentPerformance } from '../api/dashboard'

/** completionRate may be a 0–1 fraction or a 0–100 percent; normalize either. */
function pct(rate: number) {
  const p = rate <= 1 ? rate * 100 : rate
  return `${Math.round(p)}%`
}

export function DepartmentPerformanceTable({ rows }: { rows: DepartmentPerformance[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Department</th>
            <th className="px-3 py-2 font-medium">Projects</th>
            <th className="px-3 py-2 font-medium">Overdue projects</th>
            <th className="px-3 py-2 font-medium">Completion</th>
            <th className="px-3 py-2 font-medium">Overdue tasks</th>
            <th className="px-3 py-2 font-medium">Tasks</th>
            <th className="px-3 py-2 font-medium">Health</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.departmentId} className="border-b last:border-0">
              <td className="px-3 py-2 font-medium">{d.departmentName}</td>
              <td className="px-3 py-2 text-muted-foreground">{d.totalProjects}</td>
              <td className="px-3 py-2 text-muted-foreground">{d.overdueProjects}</td>
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
