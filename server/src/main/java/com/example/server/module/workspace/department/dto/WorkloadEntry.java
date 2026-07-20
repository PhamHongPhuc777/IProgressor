package com.example.server.workspace.department.dto;

import java.util.UUID;

public record WorkloadEntry(UUID userId, String fullName, long activeTaskCount, long overdueTaskCount) {
}
