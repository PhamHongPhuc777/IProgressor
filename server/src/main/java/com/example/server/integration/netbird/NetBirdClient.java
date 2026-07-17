package com.example.server.integration.netbird;

import java.util.UUID;

/**
 * Seam for syncing a user's NetBird network access with their department/Zitadel-org membership
 * (see PRD FR-5: NetBird reuses Zitadel as its OIDC IdP so app access and private-network access
 * share one identity). No real NetBird instance exists yet -- self-hosted NetBird's own quickstart
 * requires a public domain + Let's Encrypt TLS, which doesn't fit a pure local-dev setup (see
 * Markdown/SETUP.md) -- so a real implementation belongs here once one does. Only a dev-profile
 * stub exists today (DevNetBirdClient).
 */
public interface NetBirdClient {

    /** Grants network access by adding the user to their department's NetBird group. */
    void addUserToGroup(String zitadelUserId, UUID departmentId);

    /** Revokes network access, e.g. when a user is locked. */
    void removeUserFromGroup(String zitadelUserId, UUID departmentId);
}
