package com.example.server.workspace.department.dto;

import java.util.UUID;

public record DepartmentPerformance(
    UUID departmentId,
    String departmentName,
    long totalTasks,
    long completedTasks,
    long overdueTasks,
    double completionRate,
    boolean atRisk
) {
}
