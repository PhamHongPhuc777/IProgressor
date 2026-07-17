package com.example.server.task.attachment;

import java.time.Instant;
import java.util.UUID;

public record Attachment(
    UUID attachmentId,
    UUID taskId,
    UUID projectId,
    String storageType,
    String sharepointItemId,
    String url,
    UUID uploadedBy,
    String uploadedByName,
    Instant createdAt
) {
}
