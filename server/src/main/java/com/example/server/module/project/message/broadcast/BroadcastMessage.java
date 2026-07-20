package com.example.server.module.project.message.broadcast;

import java.time.Instant;
import java.util.UUID;

public record BroadcastMessage(UUID broadcastId, UUID departmentId, UUID authorId, String content, Instant createdAt) {
}
