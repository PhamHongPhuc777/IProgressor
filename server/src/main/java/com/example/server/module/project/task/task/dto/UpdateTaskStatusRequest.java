package com.example.server.module.project.task.task.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateTaskStatusRequest(@NotBlank String status) {
}
