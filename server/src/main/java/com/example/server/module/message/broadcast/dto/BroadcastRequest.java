package com.example.server.module.message.broadcast.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record BroadcastRequest(@NotNull UUID departmentId, @NotBlank String content) {
}
