package com.example.server.integration.zitadel;

/**
 * Seam for creating a Zitadel identity when an access request is approved. No real Zitadel
 * instance exists yet (see SRS NFR-4, deferred); a production implementation belongs here once
 * one does. Only a dev-profile stub exists today (DevZitadelProvisioningClient).
 */
public interface ZitadelProvisioningClient {

    /** Returns the new identity's zitadel_user_id. */
    String provisionUser(String email, String fullName);
}
