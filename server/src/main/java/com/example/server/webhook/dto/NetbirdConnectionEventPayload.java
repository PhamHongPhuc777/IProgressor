package com.example.server.webhook.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

/**
 * Provisional contract -- no real NetBird instance exists yet to confirm the actual webhook
 * payload shape against (see SRS NFR-4, deferred). Revisit once NetBird is stood up.
 */
public record NetbirdConnectionEventPayload(
    @NotBlank String zitadelUserId,
    boolean connected,
    @NotNull Instant timestamp
) {
}
