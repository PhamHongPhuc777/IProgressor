import { api } from '@/lib/api/client'

export interface MyStats {
  assignedTaskCount: number
  completedTaskCount: number
  overdueTaskCount: number
  inProgressTaskCount: number
  inReviewTaskCount: number
}

export interface MyTask {
  taskId: string
  projectId: string
  projectName: string
  title: string
  status: string
  dueDate: string | null
}

export interface WorkloadEntry {
  userId: string
  fullName: string
  activeTaskCount: number
  overdueTaskCount: number
}

export interface DepartmentPerformance {
  departmentId: string
  departmentName: string
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  completionRate: number
  atRisk: boolean
  totalProjects: number
  overdueProjects: number
}

/** Fields are role-dependent (server omits nulls), so all but the header are optional. */
export interface DashboardMe {
  roleName: string
  activeProjectCount: number
  myStats?: MyStats
  workload?: WorkloadEntry[]
  departmentPerformance?: DepartmentPerformance
}

export interface DashboardEnterprise {
  departments: DepartmentPerformance[]
}

export function getMyDashboard() {
  return api.get<DashboardMe>('/dashboard/me')
}

/** Recent/upcoming incomplete tasks assigned to me — backs the Staff dashboard's task list. */
export function getMyTasks() {
  return api.get<MyTask[]>('/me/tasks')
}

export function getEnterpriseDashboard() {
  return api.get<DashboardEnterprise>('/dashboard/enterprise')
}

/** Leader-only cross-department view / Staff's own-department "Statistics" tab. */
export function getPerformanceRisk(departmentId: string) {
  return api.get<DepartmentPerformance>(`/departments/${departmentId}/performance-risk`)
}

/** PM's own-department "Resource Allocation" tab. */
export function getResourceAllocation(departmentId: string) {
  return api.get<WorkloadEntry[]>(`/departments/${departmentId}/resource-allocation`)
}
