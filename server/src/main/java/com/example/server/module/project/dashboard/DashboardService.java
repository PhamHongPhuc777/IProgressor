package com.example.server.module.project.dashboard;

import com.example.server.module.project.dashboard.dto.DashboardEnterpriseResponse;
import com.example.server.module.project.dashboard.dto.DashboardMeResponse;
import com.example.server.module.project.me.MeService;
import com.example.server.module.project.me.dto.MyStats;
import com.example.server.module.project.ProjectService;
import com.example.server.security.AuthenticatedUser;
import com.example.server.security.CurrentUser;
import com.example.server.module.workspace.department.Department;
import com.example.server.module.workspace.department.DepartmentService;
import com.example.server.module.workspace.department.dto.DepartmentPerformance;
import com.example.server.module.workspace.department.dto.WorkloadEntry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final MeService meService;
    private final ProjectService projectService;
    private final DepartmentService departmentService;

    public DashboardMeResponse getMyDashboard() {
        AuthenticatedUser actor = CurrentUser.get();

        long activeProjectCount = actor.hasPermission("project.view.all_departments")
            ? projectService.countByDepartmentAndStatus(null, "ACTIVE")
            : projectService.countByDepartmentAndStatus(actor.departmentId(), "ACTIVE");

        MyStats myStats = actor.hasPermission("stats.view.own") ? meService.getStats() : null;
        List<WorkloadEntry> workload = actor.hasPermission("resource_allocation.view")
            ? departmentService.getResourceAllocation(actor.departmentId()) : null;
        DepartmentPerformance performance = actor.hasPermission("performance_risk.view")
            ? departmentService.getPerformanceRisk(actor.departmentId()) : null;

        return new DashboardMeResponse(actor.roleName(), activeProjectCount, myStats, workload, performance);
    }

    public DashboardEnterpriseResponse getEnterpriseDashboard() {
        List<DepartmentPerformance> performance = departmentService.list().stream()
            .map(Department::departmentId)
            .map(departmentService::getPerformanceRisk)
            .toList();
        return new DashboardEnterpriseResponse(performance);
    }
}
