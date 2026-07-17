package com.example.server.workspace.user.dto;

import jakarta.validation.constraints.NotBlank;

public record LockUserRequest(@NotBlank String reason) {
}
