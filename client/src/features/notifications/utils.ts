/** Humanize an entity type key (e.g. BROADCAST_MESSAGE -> "Broadcast message"). */
export function humanizeEntity(entityType: string): string {
  const words = entityType.toLowerCase().replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Where clicking a notification should take you — null means "nowhere in
 *  particular" (e.g. ROLE_CHANGED is already handled by the force-logout
 *  dialog; BROADCAST_MESSAGE has no dedicated detail view to link to). */
export function notificationLink(entityType: string): string | null {
  switch (entityType) {
    case 'ACCESS_REQUEST':
      return '/login-management'
    default:
      return null
  }
}

const DIVISIONS: [number, Intl.RelativeTimeFormatUnit][] = [
  [60, 'seconds'],
  [60, 'minutes'],
  [24, 'hours'],
  [7, 'days'],
  [4.34524, 'weeks'],
  [12, 'months'],
  [Number.POSITIVE_INFINITY, 'years'],
]

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

/** Compact relative time, e.g. "3 minutes ago". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  let duration = (then - Date.now()) / 1000
  for (const [amount, unit] of DIVISIONS) {
    if (Math.abs(duration) < amount) return rtf.format(Math.round(duration), unit)
    duration /= amount
  }
  return ''
}
