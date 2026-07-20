package com.example.server.module.project.task.comment.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateCommentRequest(@NotBlank String content) {
}
