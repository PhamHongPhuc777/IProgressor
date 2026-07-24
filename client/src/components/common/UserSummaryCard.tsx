import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials, cn } from '@/lib/utils'
import { useMe } from '@/features/workspace'

/**
 * Bottom-left sidebar block: avatar + name + role, with a NetBird connection
 * indicator underneath (per UI.md's "Note" section on shared layout pieces).
 */
export function UserSummaryCard() {
  const { me, user } = useMe()

  if (!me || !user) return null

  const connected = user.netbirdConnected

  return (
    <div className="flex flex-col gap-1.5 border-t px-2 py-3">
      <div className="flex items-center gap-2">
        <Avatar>
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
          <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
          <AvatarBadge
            className={connected ? 'bg-emerald-500' : 'bg-muted-foreground'}
          />
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{user.fullName}</div>
          <div className="truncate text-xs text-muted-foreground">{me.roleName}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-0.5 text-xs text-muted-foreground">
        <span
          className={cn(
            'size-1.5 rounded-full',
            connected ? 'bg-emerald-500' : 'bg-muted-foreground/50',
          )}
        />
        {connected ? 'NetBird connected' : 'NetBird offline'}
      </div>
    </div>
  )
}
