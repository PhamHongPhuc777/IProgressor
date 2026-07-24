import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import { getInitials } from '@/lib/utils'
import { getUsers, lockUser, unlockUser } from '../api/workspace'
import { useMe } from '../hooks/useMe'

/** One of Login Management's 4 sections: users filtered by NetBird connection state. */
export function NetbirdUsersList({ connected }: { connected: boolean }) {
  const { can } = useMe()
  const queryClient = useQueryClient()
  const canLock = can('user.lock_unlock')

  const users = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => getUsers({ size: 200 }),
  })
  const rows = users.data?.content.filter((u) => u.netbirdConnected === connected) ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const lock = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      lockUser(userId, reason),
    onSuccess: () => {
      toast.success('User locked.')
      invalidate()
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not lock user.'),
  })
  const unlock = useMutation({
    mutationFn: (userId: string) => unlockUser(userId),
    onSuccess: () => {
      toast.success('User unlocked.')
      invalidate()
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not unlock user.'),
  })

  if (users.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (users.isError)
    return <p className="text-sm text-destructive">Couldn’t load users.</p>
  if (rows.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        No {connected ? 'connected' : 'offline'} users.
      </p>
    )

  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {rows.map((u) => {
        const locked = u.status.toUpperCase() === 'LOCKED'
        return (
          <li key={u.userId} className="flex items-center gap-3 px-3 py-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {getInitials(u.fullName)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{u.fullName}</div>
              <div className="truncate text-xs text-muted-foreground">
                {u.departmentName ?? '—'} · {u.roleName}
              </div>
            </div>
            {u.netbirdLastSeen && (
              <span className="text-xs text-muted-foreground">
                last seen {new Date(u.netbirdLastSeen).toLocaleString()}
              </span>
            )}
            <Badge variant={locked ? 'destructive' : 'secondary'}>
              {u.status.toLowerCase()}
            </Badge>
            {canLock &&
              (locked ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={unlock.isPending}
                  onClick={() => unlock.mutate(u.userId)}
                >
                  Unlock
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={lock.isPending}
                  onClick={() => {
                    const reason = window.prompt(`Reason for locking ${u.fullName}?`)
                    if (reason?.trim()) lock.mutate({ userId: u.userId, reason: reason.trim() })
                  }}
                >
                  Lock
                </Button>
              ))}
          </li>
        )
      })}
    </ul>
  )
}
