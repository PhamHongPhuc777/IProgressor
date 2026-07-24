import { api } from '@/lib/api/client'

export const MILESTONE_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DELAYED',
] as const

export interface Milestone {
  milestoneId: string
  projectId: string
  name: string
  dueDate: string | null
  status: string
}

export function getMilestones(projectId: string) {
  return api.get<Milestone[]>(`/projects/${projectId}/milestones`)
}

export function createMilestone(
  projectId: string,
  input: { name: string; dueDate?: string | null; status?: string },
) {
  return api.post<Milestone>(`/projects/${projectId}/milestones`, input)
}

export function updateMilestone(
  id: string,
  input: { name?: string; dueDate?: string | null; status?: string },
) {
  return api.patch<Milestone>(`/milestones/${id}`, input)
}

export function deleteMilestone(id: string) {
  return api.del<void>(`/milestones/${id}`)
}
