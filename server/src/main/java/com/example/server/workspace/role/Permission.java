package com.example.server.workspace.role;

import java.util.UUID;

public record Permission(UUID permissionId, String key, String description) {
}
