package com.example.server.module.workspace.department;

import java.util.UUID;

public record Department(UUID departmentId, String name, String zitadelOrgId, String netbirdGroupId) {
}
