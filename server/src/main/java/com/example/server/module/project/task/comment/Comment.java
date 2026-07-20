package com.example.server.module.project.task.comment;

import java.time.Instant;
import java.util.UUID;

public record Comment(UUID commentId, UUID taskId, UUID authorId, String authorName, String content, Instant createdAt) {
}
