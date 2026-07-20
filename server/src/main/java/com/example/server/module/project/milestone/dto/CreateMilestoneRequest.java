package com.example.server.module.project.milestone.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record CreateMilestoneRequest(@NotBlank String name, LocalDate dueDate, String status) {
}
