package com.example.server.module.audit;

import com.example.server.integration.zitadel.ZitadelEventsClient;
import com.example.server.integration.zitadel.ZitadelIdentityEvent;
import com.example.server.module.workspace.user.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Zitadel doesn't push identity events to this app (no webhook for its own audit trail, same gap
 * as NetBird's connection events -- see NetbirdStatusPollingJob), so this polls its event log on a
 * fixed delay instead, pulling entries into audit_log alongside this app's own audit entries.
 *
 * <p>Lives in module/audit (not AuditService) deliberately: {@link UserService} already depends on
 * {@link AuditService} (to audit user actions), so AuditService depending back on UserService here
 * would be a circular bean dependency. Doing the orchestration in this class instead keeps the
 * dependency one-directional (this -> UserService -> AuditService) while still only touching
 * {@link AuditMapper} from within its own package, per ModularityTest.
 */
@Component
@RequiredArgsConstructor
public class ZitadelEventSyncJob {

    private static final String ZITADEL_EVENT_ENTITY_TYPE = "ZITADEL_EVENT";
    private static final Logger log = LoggerFactory.getLogger(ZitadelEventSyncJob.class);

    private final AuditMapper auditMapper;
    private final UserService userService;
    private final ZitadelEventsClient zitadelEventsClient;

    /** Idempotent via audit_log's (zitadel_aggregate_id, zitadel_sequence) unique constraint, so it's safe for successive polls to overlap. */
    @Scheduled(fixedDelay = 60_000)
    public void sync() {
        Instant since = auditMapper.findLatestZitadelEventCreatedAt();
        if (since == null) {
            // First run ever -- don't backfill this Zitadel instance's whole pre-existing history,
            // only sync going forward from now.
            since = Instant.now();
        }
        List<ZitadelIdentityEvent> events;
        try {
            events = zitadelEventsClient.fetchIdentityEvents(since);
        } catch (RestClientException e) {
            // Zitadel is self-hosted and may be down (e.g. its Docker container isn't running).
            // This poll runs every 60s, so log one concise line rather than letting the full stack
            // trace propagate to the scheduler's error handler on every tick. The next tick retries.
            log.warn("Skipping Zitadel event sync -- could not reach Zitadel: {}", e.getMessage());
            return;
        }
        for (ZitadelIdentityEvent event : events) {
            UUID actorId = userService.findUserIdByZitadelUserId(event.editorUserId());
            auditMapper.insertZitadelEvent(actorId, event.eventType(), ZITADEL_EVENT_ENTITY_TYPE,
                event.creationDate(), event.aggregateId(), event.sequence());
        }
    }
}
