package com.example.server.module.project.dashboard.dto;

import com.example.server.module.project.me.dto.MyStats;
import com.example.server.module.workspace.department.dto.DepartmentPerformance;
import com.example.server.module.workspace.department.dto.WorkloadEntry;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DashboardMeResponse(
    String roleName,
    long activeProjectCount,
    MyStats myStats,
    List<WorkloadEntry> workload,
    DepartmentPerformance departmentPerformance
) {
}
