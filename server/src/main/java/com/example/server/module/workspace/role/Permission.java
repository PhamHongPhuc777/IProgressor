package com.example.server.module.workspace.role;

import java.util.UUID;

public record Permission(UUID permissionId, String key, String description) {
}
