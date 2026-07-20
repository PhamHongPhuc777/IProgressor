package com.example.server.module.workspace.department.dto;

import java.util.UUID;

public record WorkloadEntry(UUID userId, String fullName, long activeTaskCount, long overdueTaskCount) {
}
