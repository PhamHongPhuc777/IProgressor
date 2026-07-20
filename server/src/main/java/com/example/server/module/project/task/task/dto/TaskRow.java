package com.example.server.module.project.task.task.dto;

import java.time.LocalDate;
import java.util.UUID;

public record TaskRow(
    UUID taskId,
    UUID projectId,
    UUID milestoneId,
    UUID parentTaskId,
    UUID assigneeId,
    String assigneeName,
    String title,
    String description,
    LocalDate startDate,
    LocalDate dueDate,
    String status,
    String priority
) {
}
