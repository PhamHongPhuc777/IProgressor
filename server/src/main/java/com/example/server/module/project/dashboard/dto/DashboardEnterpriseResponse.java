package com.example.server.module.project.dashboard.dto;

import com.example.server.module.workspace.department.dto.DepartmentPerformance;

import java.util.List;

public record DashboardEnterpriseResponse(List<DepartmentPerformance> departments) {
}
