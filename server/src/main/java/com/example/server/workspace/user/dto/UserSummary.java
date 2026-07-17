package com.example.server.workspace.user.dto;

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
    String avatarUrl
) {
}
