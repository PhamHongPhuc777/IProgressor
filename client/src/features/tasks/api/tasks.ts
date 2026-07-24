import { api } from '@/lib/api/client'

export const TASK_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'IN_REVIEW',
  'COMPLETED',
  'DELAYED',
] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

/** Mirrors the server TaskView (tags are names; server exposes no tag ids here). */
export interface TaskView {
  taskId: string
  projectId: string
  milestoneId: string | null
  parentTaskId: string | null
  assigneeId: string | null
  assigneeName: string | null
  title: string
  description: string | null
  startDate: string | null
  dueDate: string | null
  status: string
  priority: string
  tags: string[]
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  milestoneId?: string | null
  parentTaskId?: string | null
  assigneeId?: string | null
  startDate?: string | null
  dueDate?: string | null
  status?: string
  priority?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  milestoneId?: string | null
  assigneeId?: string | null
  startDate?: string | null
  dueDate?: string | null
  status?: string
  priority?: string
}

export function getTasks(projectId: string) {
  return api.get<TaskView[]>(`/projects/${projectId}/tasks`)
}

export function getTask(id: string) {
  return api.get<TaskView>(`/tasks/${id}`)
}

export function createTask(projectId: string, input: CreateTaskInput) {
  return api.post<TaskView>(`/projects/${projectId}/tasks`, input)
}

export function updateTask(id: string, input: UpdateTaskInput) {
  return api.patch<TaskView>(`/tasks/${id}`, input)
}

/** Status-only edit — Staff may use this on their own tasks (task.status.update). */
export function updateTaskStatus(id: string, status: string) {
  return api.patch<TaskView>(`/tasks/${id}/status`, { status })
}

export function deleteTask(id: string) {
  return api.del<void>(`/tasks/${id}`)
}

export function addTaskTag(id: string, name: string) {
  return api.post<TaskView>(`/tasks/${id}/tags`, { name })
}
