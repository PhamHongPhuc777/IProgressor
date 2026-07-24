import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NativeSelect } from '@/components/ui/native-select'
import { getDepartments, useMe } from '@/features/workspace'
import { getPerformanceRisk } from '../api/dashboard'
import { DepartmentPerformanceTable } from '../components/DepartmentPerformanceTable'

/** Leader-only: performance_risk.view. Cross-department, filterable by department. */
export function PerformanceRiskPage() {
  const { user } = useMe()
  const [departmentId, setDepartmentId] = useState('')

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    staleTime: 5 * 60 * 1000,
  })

  const effectiveDepartmentId = departmentId || user?.departmentId || ''
  const performance = useQuery({
    queryKey: ['performance-risk', effectiveDepartmentId],
    queryFn: () => getPerformanceRisk(effectiveDepartmentId),
    enabled: !!effectiveDepartmentId,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Performance &amp; Risk</h1>
        <p className="text-sm text-muted-foreground">
          Department health — completion, overdue work, and risk flags.
        </p>
      </div>

      <NativeSelect
        className="w-56"
        value={departmentId}
        onChange={(e) => setDepartmentId(e.target.value)}
        disabled={departments.isPending}
      >
        {departments.data?.map((d) => (
          <option key={d.departmentId} value={d.departmentId}>
            {d.name}
          </option>
        ))}
      </NativeSelect>

      {performance.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : performance.isError ? (
        <p className="text-sm text-destructive">Couldn’t load this department’s data.</p>
      ) : (
        <DepartmentPerformanceTable rows={[performance.data]} />
      )}
    </div>
  )
}
