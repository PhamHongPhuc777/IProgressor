import { api } from '@/lib/api/client'

export interface PublicDepartment {
  departmentId: string
  name: string
}

/**
 * Public department list for the onboarding form's picker. Backed by the
 * `permitAll` GET /departments/public — no token, so a prospective employee
 * with no account yet can still choose a department.
 */
export function getPublicDepartments() {
  return api.get<PublicDepartment[]>('/departments/public')
}
