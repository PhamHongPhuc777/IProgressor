package com.example.server.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateProjectRequest(
    @NotBlank String name,
    @NotNull UUID departmentId,
    UUID ownerId,
    String status,
    LocalDate startDate,
    LocalDate endDate
) {
}
