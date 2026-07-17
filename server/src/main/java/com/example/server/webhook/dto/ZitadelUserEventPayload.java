package com.example.server.webhook.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Provisional contract -- no real Zitadel instance exists yet to confirm the actual webhook
 * payload shape against (see SRS NFR-4, deferred). Revisit once Zitadel is stood up.
 */
public record ZitadelUserEventPayload(
    @NotBlank String zitadelUserId,
    @NotBlank String eventType
) {
}
