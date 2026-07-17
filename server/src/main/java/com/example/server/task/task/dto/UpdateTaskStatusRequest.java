package com.example.server.task.task.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateTaskStatusRequest(@NotBlank String status) {
}
