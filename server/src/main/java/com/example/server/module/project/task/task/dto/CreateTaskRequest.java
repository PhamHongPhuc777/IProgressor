package com.example.server.module.project.task.task.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.UUID;

public record CreateTaskRequest(
    @NotBlank String title,
    String description,
    UUID milestoneId,
    UUID parentTaskId,
    UUID assigneeId,
    LocalDate startDate,
    LocalDate dueDate,
    String status,
    String priority
) {
}
