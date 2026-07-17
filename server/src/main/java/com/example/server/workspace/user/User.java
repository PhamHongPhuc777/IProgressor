package com.example.server.workspace.user;

import java.time.Instant;
import java.util.UUID;

/** Mirrors ERD.md's USER entity field-for-field (unlike UserSummary, which trims fields for viewing other users). */
public record User(
    UUID userId,
    String fullName,
    String email,
    UUID departmentId,
    UUID roleId,
    String zitadelUserId,
    String status,
    String lockedReason,
    String avatarUrl,
    boolean netbirdConnected,
    Instant netbirdLastSeen
) {
}
