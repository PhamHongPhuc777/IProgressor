package com.example.server.audit;

import java.time.Instant;
import java.util.UUID;

public record AuditLog(
    UUID auditId,
    UUID actorId,
    String action,
    String entityType,
    UUID entityId,
    Instant createdAt
) {
}
