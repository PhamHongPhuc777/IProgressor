import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import {
  getPermissions,
  getRolePermissions,
  getRoles,
  updateRolePermissions,
} from '../api/workspace'
import { useMe } from '../hooks/useMe'

export function PermissionMatrix() {
  const { can } = useMe()
  const queryClient = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState('')
  // Desired grant state for the selected role; seeded from the server set.
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const enabled = can('authority_matrix.manage')

  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled,
    staleTime: 5 * 60 * 1000,
  })

  const permissions = useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissions,
    enabled,
    staleTime: 5 * 60 * 1000,
  })

  // Default to the first role once the list arrives.
  useEffect(() => {
    if (!selectedRoleId && roles.data?.length) {
      setSelectedRoleId(roles.data[0].roleId)
    }
  }, [roles.data, selectedRoleId])

  const rolePermissions = useQuery({
    queryKey: ['role-permissions', selectedRoleId],
    queryFn: () => getRolePermissions(selectedRoleId),
    enabled: enabled && !!selectedRoleId,
  })

  // Seed the local draft whenever the role or its server permissions change.
  const granted = useMemo(
    () => new Set(rolePermissions.data?.map((p) => p.permissionId) ?? []),
    [rolePermissions.data],
  )
  useEffect(() => {
    setChecked(new Set(granted))
  }, [granted, selectedRoleId])

  const selectedRole = roles.data?.find((r) => r.roleId === selectedRoleId)
  // The Admin row is immutable (seeded with every permission; server 403s).
  const isAdmin = selectedRole?.name.toLowerCase() === 'admin'

  const { grant, revoke } = useMemo(() => {
    const grant: string[] = []
    const revoke: string[] = []
    for (const id of checked) if (!granted.has(id)) grant.push(id)
    for (const id of granted) if (!checked.has(id)) revoke.push(id)
    return { grant, revoke }
  }, [checked, granted])

  const dirty = grant.length > 0 || revoke.length > 0

  const mutation = useMutation({
    mutationFn: () => updateRolePermissions(selectedRoleId, grant, revoke),
    onSuccess: () => {
      toast.success('Permissions updated.')
      queryClient.invalidateQueries({
        queryKey: ['role-permissions', selectedRoleId],
      })
    },
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : 'Could not save permissions.',
      ),
  })

  const toggle = (permissionId: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(permissionId)) next.delete(permissionId)
      else next.add(permissionId)
      return next
    })
  }

  if (!enabled) {
    return (
      <p className="text-sm text-muted-foreground">
        You don’t have permission to manage the authority matrix.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {roles.data?.map((role) => (
          <Button
            key={role.roleId}
            size="sm"
            variant={role.roleId === selectedRoleId ? 'default' : 'outline'}
            onClick={() => setSelectedRoleId(role.roleId)}
          >
            {role.name}
          </Button>
        ))}
        <Button
          size="sm"
          className="ml-auto"
          disabled={!dirty || isAdmin || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      {isAdmin && (
        <p className="text-sm text-muted-foreground">
          The Admin role always has every permission and can’t be edited.
        </p>
      )}

      {permissions.isPending || rolePermissions.isPending ? (
        <p className="text-sm text-muted-foreground">Loading permissions…</p>
      ) : permissions.isError ? (
        <p className="text-sm text-destructive">Couldn’t load permissions.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {permissions.data?.map((permission) => (
            <li
              key={permission.permissionId}
              className="flex items-center gap-3 px-3 py-2"
            >
              <input
                type="checkbox"
                className="size-4 shrink-0 accent-primary"
                checked={checked.has(permission.permissionId)}
                disabled={isAdmin || mutation.isPending}
                onChange={() => toggle(permission.permissionId)}
              />
              <div className="min-w-0">
                <div className="font-mono text-xs">{permission.key}</div>
                {permission.description && (
                  <div className="truncate text-xs text-muted-foreground">
                    {permission.description}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
