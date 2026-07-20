package com.example.server.module.workspace.user.dto;

import jakarta.validation.constraints.NotBlank;

public record LockUserRequest(@NotBlank String reason) {
}
