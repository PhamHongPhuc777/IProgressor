package com.example.server.security;

import java.util.UUID;

public record AuthUserRow(
    UUID userId,
    UUID departmentId,
    UUID roleId,
    String roleName,
    String fullName,
    String email,
    String status
) {
}
