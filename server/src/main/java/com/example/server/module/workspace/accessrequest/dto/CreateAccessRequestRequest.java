package com.example.server.module.workspace.accessrequest.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateAccessRequestRequest(
    @NotBlank String fullName,
    @NotBlank @Email String email,
    @NotNull UUID departmentId
) {
}
