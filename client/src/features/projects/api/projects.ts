import { api, type Page } from '@/lib/api/client'

export const PROJECT_STATUSES = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED',
] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

/** Mirrors the server Project record. */
export interface Project {
  projectId: string
  name: string
  departmentId: string
  departmentName: string | null
  ownerId: string | null
  ownerName: string | null
  status: string
  startDate: string | null
  endDate: string | null
}

export interface CreateProjectInput {
  name: string
  departmentId: string
  ownerId?: string | null
  status?: string
  startDate?: string | null
  endDate?: string | null
}

export interface UpdateProjectInput {
  name?: string
  ownerId?: string | null
  status?: string
  startDate?: string | null
  endDate?: string | null
}

export function getProjects(
  params: {
    departmentId?: string
    status?: string
    page?: number
    size?: number
  } = {},
) {
  const q = new URLSearchParams()
  if (params.departmentId) q.set('departmentId', params.departmentId)
  if (params.status) q.set('status', params.status)
  if (params.page != null) q.set('page', String(params.page))
  if (params.size != null) q.set('size', String(params.size))
  const qs = q.toString()
  return api.get<Page<Project>>(`/projects${qs ? `?${qs}` : ''}`)
}

export function getProject(id: string) {
  return api.get<Project>(`/projects/${id}`)
}

export function createProject(input: CreateProjectInput) {
  return api.post<Project>('/projects', input)
}

export function updateProject(id: string, input: UpdateProjectInput) {
  return api.patch<Project>(`/projects/${id}`, input)
}

/** Soft-delete: the server archives (sets status ARCHIVED) rather than hard-deletes. */
export function archiveProject(id: string) {
  return api.del<void>(`/projects/${id}`)
}
