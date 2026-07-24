package com.example.server.module.workspace.user.dto;

import java.time.Instant;
import java.util.UUID;

public record UserSummary(
    UUID userId,
    String fullName,
    String email,
    UUID departmentId,
    String departmentName,
    UUID roleId,
    String roleName,
    String status,
    String avatarUrl,
    boolean netbirdConnected,
    Instant netbirdLastSeen
) {
}
