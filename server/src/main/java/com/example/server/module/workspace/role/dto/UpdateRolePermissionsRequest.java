package com.example.server.module.workspace.role.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record UpdateRolePermissionsRequest(@NotNull List<UUID> permissionIds) {
}
