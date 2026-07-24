package com.example.server.integration.zitadel;

import java.util.UUID;

/**
 * Seam for creating a Zitadel identity when an access request is approved. Department maps 1:1 to
 * a Zitadel Organization (see PRD FR-1), so provisioning a user also ensures that org exists.
 */
public interface ZitadelProvisioningClient {

    /** Returns the new identity's zitadel_user_id. */
    String provisionUser(String email, String fullName, UUID departmentId);

    /**
     * Dev/test-only variant: sets a fixed password and a pre-verified email up front instead of
     * leaving both unset, so the account is immediately loggable via the browser PKCE flow without
     * Zitadel firing its "Initialize User" invite email. Returns the identity's zitadel_user_id.
     */
    String provisionUserWithPassword(String email, String fullName, UUID departmentId, String password);
}
