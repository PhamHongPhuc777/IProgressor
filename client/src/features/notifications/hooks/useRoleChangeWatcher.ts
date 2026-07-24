import { useCallback, useState } from 'react'
import { useMe } from '@/features/workspace'
import type { Notification } from '../api/notifications'

/**
 * Detects a ROLE_CHANGED notification addressed to the current user, to
 * drive a forced re-login (see ForceLogoutDialog). Must check `userId`, not
 * just entityType: SseEmitterRegistry sends every notification to Admins too
 * (matching the "Admin sees all workspaces" stream rule), so an Admin who
 * just promoted/demoted someone else would otherwise see their own screen
 * force-logout.
 */
export function useRoleChangeWatcher() {
  const { user } = useMe()
  const [triggered, setTriggered] = useState(false)

  const onEvent = useCallback(
    (notification: Notification) => {
      if (notification.entityType === 'ROLE_CHANGED' && notification.userId === user?.userId) {
        setTriggered(true)
      }
    },
    [user?.userId],
  )

  return { triggered, onEvent }
}
