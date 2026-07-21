package com.example.server.integration.netbird;

import java.util.List;
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

    /**
     * Polls NetBird's own peer list for real connection status, one entry per NetBird user that
     * owns at least one peer. NetBird Cloud doesn't yet emit peer-connection webhooks (only
     * peer-updates/user-approvals/sync-token-expiry), so this is the only way for
     * users.netbird_connected/netbird_last_seen to ever reflect a real connection.
     */
    List<NetbirdConnectionStatus> pollConnectionStatuses();
}
