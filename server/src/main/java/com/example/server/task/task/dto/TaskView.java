package com.example.server.task.task.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TaskView(
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
    String priority,
    List<String> tags
) {
    public static TaskView of(TaskRow row, List<String> tags) {
        return new TaskView(
            row.taskId(), row.projectId(), row.milestoneId(), row.parentTaskId(),
            row.assigneeId(), row.assigneeName(), row.title(), row.description(),
            row.startDate(), row.dueDate(), row.status(), row.priority(), tags
        );
    }
}
