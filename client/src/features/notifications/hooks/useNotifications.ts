import { useQuery } from '@tanstack/react-query'
import { getNotifications } from '../api/notifications'

/**
 * Notification history + unread count. A 30s `refetchInterval` is the polling
 * fallback the SSE stream (useNotificationStream) short-circuits when live.
 */
export function useNotifications() {
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ size: 50 }),
    refetchInterval: 30_000,
  })
  const unreadCount = query.data?.content.filter((n) => !n.isRead).length ?? 0
  return { query, unreadCount }
}
