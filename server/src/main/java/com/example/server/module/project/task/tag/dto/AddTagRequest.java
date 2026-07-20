package com.example.server.module.project.task.tag.dto;

import jakarta.validation.constraints.NotBlank;

public record AddTagRequest(@NotBlank String name) {
}
