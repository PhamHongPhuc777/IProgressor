package com.example.server.workspace.user.dto;

import java.time.Instant;

public record NetbirdStatus(boolean connected, Instant lastSeen) {
}
