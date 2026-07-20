package com.example.server.module.workspace.user.dto;

import java.time.Instant;

public record NetbirdStatus(boolean connected, Instant lastSeen) {
}
