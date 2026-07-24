import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { ApiError } from '@/lib/api/client'
import { useMe } from '@/features/workspace'
import { exportAuditCsv, getAuditDays, getAuditLogs } from '../api/audit'

const today = () => new Date().toISOString().slice(0, 10)

function short(id: string | null) {
  return id ? id.slice(0, 8) : '—'
}

export function AuditPage() {
  const { can } = useMe()
  const [date, setDate] = useState('') // '' = today (server default)
  const [entityType, setEntityType] = useState('')

  const canView = can('audit_log.view')

  const days = useQuery({
    queryKey: ['audit-days'],
    queryFn: getAuditDays,
    enabled: canView,
    staleTime: 5 * 60 * 1000,
  })

  const logs = useQuery({
    queryKey: ['audit-logs', date || 'today', entityType || 'all'],
    queryFn: () =>
      getAuditLogs({
        date: date || undefined,
        entityType: entityType || undefined,
        size: 100,
      }),
    enabled: canView,
  })

  const exportCsv = useMutation({
    mutationFn: async () => {
      const d = date || today()
      const blob = await exportAuditCsv(d)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${d}.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Could not export CSV.'),
  })

  if (!canView) {
    return (
      <p className="text-sm text-muted-foreground">
        You don’t have permission to view the audit log.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Audit log</h1>
          <p className="text-sm text-muted-foreground">
            Activity for the selected day.
          </p>
        </div>
        {can('audit_log.export') && (
          <Button
            variant="outline"
            disabled={exportCsv.isPending}
            onClick={() => exportCsv.mutate()}
          >
            <Download />
            {exportCsv.isPending ? 'Exporting…' : 'Export CSV'}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          className="w-48"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        >
          <option value="">Today</option>
          {days.data?.map((d) => (
            <option key={d} value={d}>
              {new Date(d).toLocaleDateString()}
            </option>
          ))}
        </NativeSelect>
        <Input
          className="w-48"
          placeholder="Filter by entity type"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        />
        {logs.data && (
          <span className="ml-auto text-sm text-muted-foreground">
            {logs.data.totalElements} entr
            {logs.data.totalElements === 1 ? 'y' : 'ies'}
          </span>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.isPending ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : logs.isError ? (
            <p className="p-4 text-sm text-destructive">
              Couldn’t load the audit log.
            </p>
          ) : logs.data.content.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No activity for this day.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Time</th>
                    <th className="px-3 py-2 font-medium">Actor</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                    <th className="px-3 py-2 font-medium">Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.data.content.map((log) => (
                    <tr key={log.auditId} className="border-b last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {log.actorId ? short(log.actorId) : 'System'}
                      </td>
                      <td className="px-3 py-2">{log.action}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {log.entityType}
                        {log.entityId && (
                          <span className="ml-1 font-mono text-xs">
                            {short(log.entityId)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
