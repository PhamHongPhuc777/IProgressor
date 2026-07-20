package com.example.server.module.workspace.user.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ChangeRoleRequest(@NotNull UUID roleId, boolean confirm) {
}
