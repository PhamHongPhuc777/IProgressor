import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { ApiError } from '@/lib/api/client'
import { getInitials } from '@/lib/utils'
import {
  changeUserRole,
  getDepartments,
  getRoles,
  getUsers,
  lockUser,
  unlockUser,
  type UserSummary,
} from '../api/workspace'
import { useMe } from '../hooks/useMe'

function StatusBadge({ status }: { status: string }) {
  const locked = status.toUpperCase() === 'LOCKED'
  return (
    <Badge variant={locked ? 'destructive' : 'secondary'}>
      {status.toLowerCase()}
    </Badge>
  )
}

function toastError(error: unknown, fallback: string) {
  toast.error(error instanceof ApiError ? error.message : fallback)
}

export function MembersTable() {
  const { can } = useMe()
  const queryClient = useQueryClient()
  const [departmentId, setDepartmentId] = useState('')

  const canManageRoles = can('user.role.change')
  const canLock = can('user.lock_unlock')

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    enabled: can('workspace.members.view'),
    staleTime: 5 * 60 * 1000,
  })

  const usersKey = ['users', departmentId || 'all'] as const
  const users = useQuery({
    queryKey: usersKey,
    queryFn: () => getUsers({ departmentId: departmentId || undefined, size: 100 }),
  })

  // Role options for the change-role picker — only fetched for those who can.
  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: canManageRoles,
    staleTime: 5 * 60 * 1000,
  })

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ['users'] })

  const roleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      changeUserRole(userId, roleId),
    onSuccess: () => {
      toast.success('Role updated.')
      invalidateUsers()
    },
    onError: (error) => toastError(error, 'Could not change role.'),
  })

  const lockMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      lockUser(userId, reason),
    onSuccess: () => {
      toast.success('User locked.')
      invalidateUsers()
    },
    onError: (error) => toastError(error, 'Could not lock user.'),
  })

  const unlockMutation = useMutation({
    mutationFn: (userId: string) => unlockUser(userId),
    onSuccess: () => {
      toast.success('User unlocked.')
      invalidateUsers()
    },
    onError: (error) => toastError(error, 'Could not unlock user.'),
  })

  const onChangeRole = (user: UserSummary, roleId: string) => {
    if (roleId === user.roleId) return
    const roleName = roles.data?.find((r) => r.roleId === roleId)?.name ?? 'role'
    if (
      !window.confirm(`Change ${user.fullName}'s role to ${roleName}?`)
    )
      return
    roleMutation.mutate({ userId: user.userId, roleId })
  }

  const onLock = (user: UserSummary) => {
    const reason = window.prompt(`Reason for locking ${user.fullName}?`)
    if (reason == null || reason.trim() === '') return
    lockMutation.mutate({ userId: user.userId, reason: reason.trim() })
  }

  if (!can('enterprise.members.view')) {
    return (
      <p className="text-sm text-muted-foreground">
        You don’t have permission to view members.
      </p>
    )
  }

  const showActions = canManageRoles || canLock
  const busy =
    roleMutation.isPending || lockMutation.isPending || unlockMutation.isPending

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="dept-filter" className="text-sm text-muted-foreground">
          Department
        </label>
        <NativeSelect
          id="dept-filter"
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
        {users.data && (
          <span className="ml-auto text-sm text-muted-foreground">
            {users.data.totalElements} member
            {users.data.totalElements === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {users.isPending ? (
        <p className="text-sm text-muted-foreground">Loading members…</p>
      ) : users.isError ? (
        <p className="text-sm text-destructive">
          Couldn’t load members.{' '}
          <button
            type="button"
            onClick={() => users.refetch()}
            className="underline"
          >
            Retry
          </button>
        </p>
      ) : users.data.content.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Member</th>
                <th className="px-3 py-2 font-medium">Department</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Status</th>
                {showActions && (
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.data.content.map((user) => {
                const locked = user.status.toUpperCase() === 'LOCKED'
                return (
                  <tr key={user.userId} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {getInitials(user.fullName)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {user.fullName}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {user.departmentName ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {canManageRoles && roles.data ? (
                        <NativeSelect
                          className="w-32"
                          value={user.roleId}
                          disabled={busy}
                          onChange={(e) => onChangeRole(user, e.target.value)}
                        >
                          {roles.data.map((r) => (
                            <option key={r.roleId} value={r.roleId}>
                              {r.name}
                            </option>
                          ))}
                        </NativeSelect>
                      ) : (
                        <Badge variant="outline">{user.roleName}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={user.status} />
                    </td>
                    {showActions && (
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          {canLock &&
                            (locked ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  unlockMutation.mutate(user.userId)
                                }
                              >
                                Unlock
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => onLock(user)}
                              >
                                Lock
                              </Button>
                            ))}
                        </div>
                      </td>
                    )}
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
