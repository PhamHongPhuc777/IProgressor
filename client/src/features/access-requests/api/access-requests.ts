import { api } from '@/lib/api/client'

export interface AccessRequestInput {
  fullName: string
  email: string
  departmentId: string
  message?: string
}

export interface AccessRequest {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

/**
 * Public onboarding submission. Deliberately does NOT touch Zitadel — an
 * unapproved person has no account yet; approval triggers the invite email.
 */
export function submitAccessRequest(input: AccessRequestInput) {
  return api.post<AccessRequest>('/access-requests', input)
}
