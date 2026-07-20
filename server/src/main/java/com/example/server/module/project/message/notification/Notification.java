package com.example.server.module.project.message.notification;

import java.time.Instant;
import java.util.UUID;

public record Notification(UUID notificationId, UUID userId, String entityType, UUID entityId, boolean isRead, Instant createdAt) {
}
