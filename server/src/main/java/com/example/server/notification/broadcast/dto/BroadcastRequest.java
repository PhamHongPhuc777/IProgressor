package com.example.server.notification.broadcast.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record BroadcastRequest(@NotNull UUID departmentId, @NotBlank String content) {
}
