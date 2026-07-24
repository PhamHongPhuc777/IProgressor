import { api, type Page } from '@/lib/api/client'

/** actorId/entityId are null for synced ZITADEL_EVENT rows — UI must handle it. */
export interface AuditLog {
  auditId: string
  actorId: string | null
  action: string
  entityType: string
  entityId: string | null
  createdAt: string
}

export function getAuditLogs(
  params: {
    date?: string
    actorId?: string
    entityType?: string
    page?: number
    size?: number
  } = {},
) {
  const q = new URLSearchParams()
  if (params.date) q.set('date', params.date)
  if (params.actorId) q.set('actorId', params.actorId)
  if (params.entityType) q.set('entityType', params.entityType)
  if (params.page != null) q.set('page', String(params.page))
  if (params.size != null) q.set('size', String(params.size))
  const qs = q.toString()
  return api.get<Page<AuditLog>>(`/audit-logs${qs ? `?${qs}` : ''}`)
}

/** Days that have log data — for the date picker. */
export function getAuditDays() {
  return api.get<string[]>('/audit-logs/days')
}

export function exportAuditCsv(date: string) {
  return api.getBlob(`/audit-logs/export?date=${date}&format=csv`)
}
