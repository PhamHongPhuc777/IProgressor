package com.example.server.workspace.user.dto;

import java.util.UUID;

public record UserRoleInfo(UUID userId, UUID departmentId, String roleName, String status) {
}
