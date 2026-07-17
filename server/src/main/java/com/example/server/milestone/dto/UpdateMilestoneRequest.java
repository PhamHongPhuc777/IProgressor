package com.example.server.milestone.dto;

import java.time.LocalDate;

public record UpdateMilestoneRequest(String name, LocalDate dueDate, String status) {
}
