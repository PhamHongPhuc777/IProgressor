package com.example.server.integration.zitadel;

import java.time.Instant;

/**
 * One row from Zitadel's Admin API event log (see RealZitadelEventsClient), trimmed to what
 * ZitadelEventSyncJob actually persists into audit_log.
 */
public record ZitadelIdentityEvent(
    String editorUserId,
    String aggregateId,
    long sequence,
    Instant creationDate,
    String eventType
) {
}
