package com.example.server.integration.netbird;

import java.util.UUID;

/**
 * Seam for syncing a user's NetBird network access with their department membership (see PRD
 * FR-5: NetBird gates access to sensitive infra, grouped per department). Matches NetBird users by
 * email rather than Zitadel identity -- NetBird Cloud can't reach a local self-hosted Zitadel
 * instance to do OIDC discovery for SSO, so idp_id-based linkage isn't viable for local dev (see
 * Markdown/SETUP.md).
 */
public interface NetBirdClient {

    /**
     * Grants network access: invites the user to the NetBird account (if not already present) and
     * ensures their department's group is in their auto_groups.
     */
    void addUserToGroup(String email, String fullName, UUID departmentId);

    /** Revokes network access by removing the department's group from the user's auto_groups. */
    void removeUserFromGroup(String email, UUID departmentId);
}
