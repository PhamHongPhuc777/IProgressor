import { api, type Page } from '@/lib/api/client'

/** Admin-side view of an access request (mirrors the server AccessRequest record). */
export interface AccessRequest {
  requestId: string
  requestType: string
  fullName: string
  email: string
  departmentId: string | null
  existingUserId: string | null
  status: string
  requestedAt: string
  reviewedBy: string | null
  reviewedAt: string | null
  createdUserId: string | null
}

export function listAccessRequests(
  params: {
    status?: string
    departmentId?: string
    page?: number
    size?: number
  } = {},
) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.departmentId) q.set('departmentId', params.departmentId)
  if (params.page != null) q.set('page', String(params.page))
  if (params.size != null) q.set('size', String(params.size))
  const qs = q.toString()
  return api.get<Page<AccessRequest>>(
    `/access-requests${qs ? `?${qs}` : ''}`,
  )
}

/** Approve → provisions Zitadel identity + users row + NetBird invite (server-side). */
export function approveAccessRequest(id: string) {
  return api.post<AccessRequest>(`/access-requests/${id}/approve`)
}

export function rejectAccessRequest(id: string) {
  return api.post<AccessRequest>(`/access-requests/${id}/reject`)
}
