package com.example.server.me.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateAvatarRequest(@NotBlank String avatarUrl) {
}
