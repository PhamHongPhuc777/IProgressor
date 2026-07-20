package com.example.server.module.project.dto;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateProjectRequest(
    String name,
    UUID ownerId,
    String status,
    LocalDate startDate,
    LocalDate endDate
) {
}
