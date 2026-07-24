import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { ApiError } from '@/lib/api/client'
import {
  approveAccessRequest,
  listAccessRequests,
  rejectAccessRequest,
  type AccessRequest,
} from '../api/access-requests'
import { getDepartments } from '../api/workspace'
import { useMe } from '../hooks/useMe'

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: '', label: 'All' },
] as const

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  const variant =
    s === 'APPROVED' ? 'secondary' : s === 'REJECTED' ? 'destructive' : 'outline'
  return <Badge variant={variant}>{status.toLowerCase()}</Badge>
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString()
}

export function ApprovalsInbox({
  typeFilter,
}: {
  /** Restrict to unlock (existingUserId set) or new-account requests; also
   *  locks the status filter to PENDING and hides the dropdown, matching
   *  UI.md's dedicated "unlock requests" / "pending access requests" lists. */
  typeFilter?: 'unlock' | 'new'
} = {}) {
  const { can } = useMe()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<string>('PENDING')
  const effectiveStatus = typeFilter ? 'PENDING' : status

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    enabled: can('workspace.members.view'),
    staleTime: 5 * 60 * 1000,
  })
  const departmentName = useMemo(() => {
    const map = new Map(departments.data?.map((d) => [d.departmentId, d.name]))
    return (id: string | null) => (id ? (map.get(id) ?? '—') : '—')
  }, [departments.data])

  const requests = useQuery({
    queryKey: ['access-requests', effectiveStatus || 'all'],
    queryFn: () => listAccessRequests({ status: effectiveStatus || undefined, size: 100 }),
  })
  const visibleContent = requests.data?.content.filter((r) =>
    typeFilter === 'unlock'
      ? !!r.existingUserId
      : typeFilter === 'new'
        ? !r.existingUserId
        : true,
  )

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['access-requests'] })

  const approve = useMutation({
    mutationFn: (id: string) => approveAccessRequest(id),
    onSuccess: () => {
      toast.success('Approved — account provisioned and invites sent.')
      invalidate()
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : 'Could not approve.'),
  })

  const reject = useMutation({
    mutationFn: (id: string) => rejectAccessRequest(id),
    onSuccess: () => {
      toast.success('Request rejected.')
      invalidate()
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : 'Could not reject.'),
  })

  const busy = approve.isPending || reject.isPending

  const onApprove = (req: AccessRequest) => {
    const isUnlock = !!req.existingUserId
    const msg = isUnlock
      ? `Approve unlock for ${req.fullName}? This reactivates their account.`
      : `Approve access for ${req.fullName}? This creates their account and sends the Zitadel + NetBird invites.`
    if (window.confirm(msg)) approve.mutate(req.requestId)
  }

  const onReject = (req: AccessRequest) => {
    if (window.confirm(`Reject the request from ${req.fullName}?`))
      reject.mutate(req.requestId)
  }

  if (!can('access_request.manage')) {
    return (
      <p className="text-sm text-muted-foreground">
        You don’t have permission to review access requests.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {!typeFilter && (
          <>
            <label htmlFor="status-filter" className="text-sm text-muted-foreground">
              Status
            </label>
            <NativeSelect
              id="status-filter"
              className="w-40"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </>
        )}
        {visibleContent && (
          <span className="ml-auto text-sm text-muted-foreground">
            {visibleContent.length} request{visibleContent.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {requests.isPending ? (
        <p className="text-sm text-muted-foreground">Loading requests…</p>
      ) : requests.isError ? (
        <p className="text-sm text-destructive">
          Couldn’t load requests.{' '}
          <button
            type="button"
            onClick={() => requests.refetch()}
            className="underline"
          >
            Retry
          </button>
        </p>
      ) : !visibleContent || visibleContent.length === 0 ? (
        <p className="text-sm text-muted-foreground">No requests here.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Applicant</th>
                <th className="px-3 py-2 font-medium">Department</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Requested</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleContent.map((req) => {
                const pending = req.status.toUpperCase() === 'PENDING'
                return (
                  <tr key={req.requestId} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-medium">{req.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {req.email}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {departmentName(req.departmentId)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {req.existingUserId ? 'Unlock' : 'New account'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDate(req.requestedAt)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        {pending && (
                          <>
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => onApprove(req)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => onReject(req)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
