package com.example.server.module.project.me.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateAvatarRequest(@NotBlank String avatarUrl) {
}
