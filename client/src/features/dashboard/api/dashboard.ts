import { api } from '@/lib/api/client'

export interface MyStats {
  assignedTaskCount: number
  completedTaskCount: number
  overdueTaskCount: number
  inProgressTaskCount: number
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

export function getEnterpriseDashboard() {
  return api.get<DashboardEnterprise>('/dashboard/enterprise')
}
