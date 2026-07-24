import { api, type Page } from '@/lib/api/client'

/** Mirrors the server Notification record — a reference (entityType/entityId),
 *  not a rendered message; the UI derives a label from entityType. */
export interface Notification {
  notificationId: string
  userId: string
  entityType: string
  entityId: string | null
  isRead: boolean
  createdAt: string
}

export function getNotifications(params: { page?: number; size?: number } = {}) {
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', String(params.page))
  if (params.size != null) q.set('size', String(params.size))
  const qs = q.toString()
  return api.get<Page<Notification>>(`/notifications${qs ? `?${qs}` : ''}`)
}

export function markNotificationRead(id: string) {
  return api.patch<void>(`/notifications/${id}/read`)
}

export function broadcast(departmentId: string, content: string) {
  return api.post<unknown>('/notifications/broadcast', { departmentId, content })
}
