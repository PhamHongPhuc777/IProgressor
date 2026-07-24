import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMe } from '@/features/workspace'
import { markNotificationRead } from '../api/notifications'
import { useNotifications } from '../hooks/useNotifications'
import { humanizeEntity, notificationLink, timeAgo } from '../utils'

export function NotificationsBell() {
  const { user } = useMe()
  const { query, unreadCount } = useNotifications()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const recent = query.data?.content.slice(0, 6) ?? []

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border bg-popover shadow-md">
          <div className="border-b px-3 py-2 text-sm font-medium">
            Notifications
          </div>
          {query.isPending ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              You’re all caught up.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {recent.map((n) => {
                // Admin's list includes every user's notifications (matches
                // "Admin sees all workspaces"), but the backend only allows
                // marking your own as read.
                const isOwn = n.userId === user?.userId
                const link = notificationLink(n.entityType)
                return (
                  <li key={n.notificationId}>
                    <button
                      type="button"
                      // The row itself always stays clickable (for
                      // navigation) even when there's nothing left to mark
                      // read — a previous version disabled the whole button
                      // in that case, which made clicking silently do
                      // nothing.
                      onClick={() => {
                        if (isOwn && !n.isRead) markRead.mutate(n.notificationId)
                        setOpen(false)
                        if (link) navigate(link)
                      }}
                      className={cn(
                        'flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50',
                        n.isRead && 'opacity-60',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1.5 size-2 shrink-0 rounded-full',
                          n.isRead ? 'bg-transparent' : 'bg-primary',
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block truncate">
                          {humanizeEntity(n.entityType)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t px-3 py-2 text-center text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  )
}
