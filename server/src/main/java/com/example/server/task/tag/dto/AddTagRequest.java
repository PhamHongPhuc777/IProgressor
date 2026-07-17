package com.example.server.task.tag.dto;

import jakarta.validation.constraints.NotBlank;

public record AddTagRequest(@NotBlank String name) {
}
