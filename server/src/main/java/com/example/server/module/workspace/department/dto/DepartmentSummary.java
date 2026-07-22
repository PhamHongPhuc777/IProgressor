package com.example.server.module.workspace.department.dto;

import java.util.UUID;

/** Minimal, unauthenticated-safe shape for the public access-request form's department picker. */
public record DepartmentSummary(UUID departmentId, String name) {
}
