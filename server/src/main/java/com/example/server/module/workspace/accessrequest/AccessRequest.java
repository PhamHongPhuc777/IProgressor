package com.example.server.module.workspace.accessrequest;

import java.time.Instant;
import java.util.UUID;

public record AccessRequest(
    UUID requestId,
    String requestType,
    String fullName,
    String email,
    UUID departmentId,
    UUID existingUserId,
    String status,
    Instant requestedAt,
    UUID reviewedBy,
    Instant reviewedAt,
    UUID createdUserId
) {
}
