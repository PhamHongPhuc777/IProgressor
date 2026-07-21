package com.example.server.module.workspace.role.dto;

import java.util.List;
import java.util.UUID;

/** Delta update -- only the permissions actually changing, not the role's full permission set. */
public record UpdateRolePermissionsRequest(List<UUID> grant, List<UUID> revoke) {

    public UpdateRolePermissionsRequest {
        grant = grant == null ? List.of() : grant;
        revoke = revoke == null ? List.of() : revoke;
    }
}
