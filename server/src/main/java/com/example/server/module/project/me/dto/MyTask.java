package com.example.server.module.project.me.dto;

import java.time.LocalDate;
import java.util.UUID;

/** Lightweight row for the Staff dashboard's "assigned to me" list -- links out to the project. */
public record MyTask(
    UUID taskId,
    UUID projectId,
    String projectName,
    String title,
    String status,
    LocalDate dueDate
) {
}
