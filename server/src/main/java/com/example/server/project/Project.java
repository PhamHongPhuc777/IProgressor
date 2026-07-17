package com.example.server.project;

import java.time.LocalDate;
import java.util.UUID;

public record Project(
    UUID projectId,
    String name,
    UUID departmentId,
    String departmentName,
    UUID ownerId,
    String ownerName,
    String status,
    LocalDate startDate,
    LocalDate endDate
) {
}
