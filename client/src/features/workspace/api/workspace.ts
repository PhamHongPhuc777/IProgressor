import { api, type Page } from '@/lib/api/client'

// Types mirror the server DTOs (camelCase Jackson output).

export interface Department {
  departmentId: string
  name: string
  zitadelOrgId: string | null
  netbirdGroupId: string | null
}

export interface Role {
  roleId: string
  name: string
}

export interface Permission {
  permissionId: string
  key: string
  description: string
}

export interface UserSummary {
  userId: string
  fullName: string
  email: string
  departmentId: string | null
  departmentName: string | null
  roleId: string
  roleName: string
  status: string
  avatarUrl: string | null
}

export interface MeProfile {
  roleName: string
  departmentName: string | null
  permissions: string[]
}

export function getMe() {
  return api.get<MeProfile>('/me')
}

export function getDepartments() {
  return api.get<Department[]>('/departments')
}

/** Members of one department — accessible to PMs (workspace.members.view), unlike
 *  the enterprise-wide GET /users, so it backs assignee/owner pickers for them. */
export function getDepartmentMembers(
  departmentId: string,
  params: { page?: number; size?: number } = {},
) {
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', String(params.page))
  if (params.size != null) q.set('size', String(params.size))
  const qs = q.toString()
  return api.get<Page<UserSummary>>(
    `/departments/${departmentId}/members${qs ? `?${qs}` : ''}`,
  )
}

export function getUsers(
  params: { departmentId?: string; page?: number; size?: number } = {},
) {
  const q = new URLSearchParams()
  if (params.departmentId) q.set('departmentId', params.departmentId)
  if (params.page != null) q.set('page', String(params.page))
  if (params.size != null) q.set('size', String(params.size))
  const qs = q.toString()
  return api.get<Page<UserSummary>>(`/users${qs ? `?${qs}` : ''}`)
}

/** PATCH requires confirm:true; peer-protection rules are enforced server-side. */
export function changeUserRole(userId: string, roleId: string) {
  return api.patch<UserSummary>(`/users/${userId}/role`, { roleId, confirm: true })
}

export function lockUser(userId: string, reason: string) {
  return api.post<UserSummary>(`/users/${userId}/lock`, { reason })
}

export function unlockUser(userId: string) {
  return api.post<UserSummary>(`/users/${userId}/unlock`)
}

export function getRoles() {
  return api.get<Role[]>('/roles')
}

export function getPermissions() {
  return api.get<Permission[]>('/permissions')
}

export function getRolePermissions(roleId: string) {
  return api.get<Permission[]>(`/roles/${roleId}/permissions`)
}

/** Delta update — send only the permissions changing (grant/revoke id lists). */
export function updateRolePermissions(
  roleId: string,
  grant: string[],
  revoke: string[],
) {
  return api.patch<Permission[]>(`/roles/${roleId}/permissions`, { grant, revoke })
}
