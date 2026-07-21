package com.example.server.integration.netbird;

import java.time.Instant;

/** One NetBird account's aggregated connection state, joined from /api/peers by owning user email. */
public record NetbirdConnectionStatus(String email, boolean connected, Instant lastSeen) {
}
