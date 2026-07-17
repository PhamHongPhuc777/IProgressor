package com.example.server.security;

import java.util.Set;
import java.util.UUID;

public record AuthenticatedUser(
    UUID userId,
    UUID departmentId,
    UUID roleId,
    String roleName,
    String fullName,
    String email,
    Set<String> permissions
) {

    public boolean hasPermission(String key) {
        return permissions.contains(key);
    }

    public boolean isAdmin() {
        return "Admin".equals(roleName);
    }
}
