package com.example.server.module.project.milestone;

import java.time.LocalDate;
import java.util.UUID;

public record Milestone(UUID milestoneId, UUID projectId, String name, LocalDate dueDate, String status) {
}
