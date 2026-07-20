package com.example.server.dashboard.dto;

import com.example.server.workspace.department.dto.DepartmentPerformance;

import java.util.List;

public record DashboardEnterpriseResponse(List<DepartmentPerformance> departments) {
}
