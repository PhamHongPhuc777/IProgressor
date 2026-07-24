import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useMe } from '@/features/workspace'
import { markNotificationRead } from '../api/notifications'
import { useNotifications } from '../hooks/useNotifications'
import { humanizeEntity, timeAgo } from '../utils'

export function NotificationsPage() {
  const { user } = useMe()
  const { query } = useNotifications()
  const queryClient = useQueryClient()

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Your recent activity.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {query.isPending ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : query.isError ? (
            <p className="p-4 text-sm text-destructive">
              Couldn’t load notifications.
            </p>
          ) : query.data.content.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y">
              {query.data.content.map((n) => {
                // Admin's list includes every user's notifications (matches
                // "Admin sees all workspaces"), but the backend only allows
                // marking your own as read.
                const isOwn = n.userId === user?.userId
                return (
                  <li
                    key={n.notificationId}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3',
                      n.isRead && 'opacity-60',
                    )}
                  >
                    <span
                      className={cn(
                        'size-2 shrink-0 rounded-full',
                        n.isRead ? 'bg-transparent' : 'bg-primary',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm">{humanizeEntity(n.entityType)}</div>
                      <div className="text-xs text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    {!n.isRead && isOwn && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate(n.notificationId)}
                      >
                        Mark read
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
