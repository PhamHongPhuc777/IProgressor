package com.example.server.module.project.task.task.dto;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateTaskRequest(
    String title,
    String description,
    UUID milestoneId,
    UUID assigneeId,
    LocalDate startDate,
    LocalDate dueDate,
    String status,
    String priority
) {
}
